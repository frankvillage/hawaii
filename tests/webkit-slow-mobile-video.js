"use strict";

const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { devices, webkit } = require("@playwright/test");
const sharp = require("../web/node_modules/sharp");

const baseUrl = process.env.WEB_BASE_URL ?? "http://127.0.0.1:3000";
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY = "1";

function hash(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function normalizedPixelDifference(first, second) {
  const [left, right] = await Promise.all([
    sharp(first).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(second).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  ]);
  assert.deepEqual(left.info, right.info, "Poster comparison images must have equal dimensions");

  let difference = 0;
  for (let index = 0; index < left.data.length; index += 1) {
    difference += Math.abs(left.data[index] - right.data[index]);
  }
  return difference / (left.data.length * 255);
}

function testUrl(name) {
  const url = new URL(baseUrl);
  url.searchParams.set("playback-test", name);
  return url.toString();
}

async function main() {
  const browser = await webkit.launch({ headless: true });
  const context = await browser.newContext({ ...devices["iPhone 13"] });

  try {
    const slowPage = await context.newPage();
    let releaseMedia;
    let signalFirstMediaRequest;
    let mediaReleased = false;
    let firstMediaRequestSeen = false;
    const mediaGate = new Promise((resolve) => {
      releaseMedia = () => {
        if (mediaReleased) return;
        mediaReleased = true;
        resolve();
      };
    });
    const firstMediaRequest = new Promise((resolve) => {
      signalFirstMediaRequest = () => {
        if (firstMediaRequestSeen) return;
        firstMediaRequestSeen = true;
        resolve();
      };
    });

    try {
      await slowPage.addInitScript(() => {
        const nativePlay = HTMLMediaElement.prototype.play;
        window.__slowMediaPlayAttempts = 0;
        HTMLMediaElement.prototype.play = function countedPlay() {
          window.__slowMediaPlayAttempts += 1;
          return nativePlay.call(this);
        };
      });
      await slowPage.route("**/*.mp4*", async (route) => {
        signalFirstMediaRequest();
        await mediaGate;
        await route.continue();
      });

      await slowPage.goto(testUrl("slow-metadata"), { waitUntil: "domcontentloaded" });
      const stage = slowPage.locator('[data-testid="hero-stage"]');
      const mediaStage = slowPage.locator('[data-testid="scroll-video-stage"]');
      const video = slowPage.locator('[data-testid="journey-video"]');
      await Promise.all([firstMediaRequest, video.waitFor({ state: "visible" })]);

      const poster = await video.getAttribute("poster");
      assert.match(poster ?? "", /\.(?:jpe?g|webp)(?:\?.*)?$/i, "Loading video must retain a poster");
      await slowPage.evaluate((posterUrl) => {
        const journeyVideo = document.querySelector('[data-testid="journey-video"]');
        const rect = journeyVideo.getBoundingClientRect();
        const videoStyle = getComputedStyle(journeyVideo);
        const probe = document.createElement("img");
        probe.id = "journey-poster-probe";
        probe.alt = "";
        probe.src = posterUrl;
        probe.style.position = "fixed";
        probe.style.left = `${rect.left}px`;
        probe.style.top = `${rect.top}px`;
        probe.style.width = `${rect.width}px`;
        probe.style.height = `${rect.height}px`;
        probe.style.objectFit = videoStyle.objectFit;
        probe.style.objectPosition = videoStyle.objectPosition;
        probe.style.zIndex = "2147483647";
        document.body.append(probe);
      }, poster);
      const posterProbe = slowPage.locator("#journey-poster-probe");
      await posterProbe.evaluate((image) => image.decode());
      const posterFrame = await posterProbe.screenshot();
      await posterProbe.evaluate((image) => image.remove());
      await slowPage.evaluate(() => {
        const isolation = document.createElement("style");
        isolation.id = "journey-video-isolation";
        isolation.textContent =
          'body * { visibility: hidden !important; } [data-testid="journey-video"] { visibility: visible !important; }';
        document.head.append(isolation);
      });
      const loadingFrame = await video.screenshot();
      await slowPage.locator("#journey-video-isolation").evaluate((style) => style.remove());
      const posterDifference = await normalizedPixelDifference(loadingFrame, posterFrame);
      assert.ok(
        posterDifference < 0.03,
        `The loading video must visibly paint its poster: difference ${posterDifference}`,
      );

      await mediaStage.dispatchEvent("touchstart", { bubbles: true, cancelable: true });
      await slowPage.evaluate(() => {
        document.documentElement.style.scrollBehavior = "auto";
        const journey = document.querySelector('[data-testid="hero-stage"]');
        const scrollable = Math.max(journey.offsetHeight - window.innerHeight, 1);
        const journeyTop = window.scrollY + journey.getBoundingClientRect().top;
        window.scrollTo({ top: journeyTop + scrollable * 0.04, behavior: "auto" });
      });
      await mediaStage.dispatchEvent("touchend", { bubbles: true, cancelable: true });
      await slowPage.waitForTimeout(4200);

      const loadingState = await stage.evaluate((element) => ({
        mediaMode: element.dataset.mediaMode,
        fallbackReason: element.dataset.fallbackReason,
        scrollProgress: Number(element.dataset.scrollProgress),
        targetTime: Number(element.dataset.targetTime),
        videoCount: element.querySelectorAll('[data-testid="journey-video"]').length,
        playAttempts: window.__slowMediaPlayAttempts ?? 0,
      }));
      assert.equal(
        loadingState.mediaMode,
        "video",
        `Slow initial metadata must retain video mode: ${JSON.stringify(loadingState)}`,
      );
      assert.equal(loadingState.videoCount, 1, "Slow initial metadata must retain the video element");
      assert.ok(loadingState.scrollProgress > 0, "Scroll progress must be retained before metadata");
      assert.ok(loadingState.targetTime > 0, "Target time must be retained before metadata");
      assert.ok(loadingState.playAttempts > 0, "Touch must request playback before metadata arrives");

      releaseMedia();
      await slowPage.waitForFunction(() => {
        const journeyVideo = document.querySelector('[data-testid="journey-video"]');
        return journeyVideo && Number.isFinite(journeyVideo.duration) && journeyVideo.duration > 0;
      });
      await slowPage.waitForFunction(() => {
        const journeyVideo = document.querySelector('[data-testid="journey-video"]');
        return journeyVideo && !journeyVideo.paused && journeyVideo.currentTime >= 0.5;
      });

      const samples = [];
      const frameHashes = [];
      for (let index = 0; index < 10; index += 1) {
        await slowPage.waitForTimeout(120);
        samples.push(await video.evaluate((element) => Number(element.currentTime)));
        if (index === 0 || index === 9) frameHashes.push(hash(await video.screenshot()));
      }
      const deltas = samples.slice(1).map((time, index) => time - samples[index]);
      assert.ok(
        samples.at(-1) > samples[0] + 0.3,
        `Released slow media must advance without another scroll: ${samples.join(", ")}`,
      );
      assert.ok(
        deltas.every((delta) => delta >= -0.05 && delta < 0.35),
        `Released slow media must present continuous frames: ${samples.join(", ")}`,
      );
      assert.notEqual(
        frameHashes[0],
        frameHashes[1],
        "Released slow media must visibly paint multiple decoded frames",
      );
    } finally {
      releaseMedia();
      await slowPage.close();
    }

    const errorPage = await context.newPage();
    try {
      await errorPage.route("**/*.mp4*", (route) => route.abort("failed"));
      await errorPage.goto(testUrl("media-error"), { waitUntil: "domcontentloaded" });
      await errorPage.waitForFunction(() => {
        const stage = document.querySelector('[data-testid="hero-stage"]');
        return stage?.dataset.mediaMode === "fallback" &&
          stage.dataset.fallbackReason === "media-error";
      });
      const errorState = await errorPage.locator('[data-testid="hero-stage"]').evaluate((stage) => ({
        mediaMode: stage.dataset.mediaMode,
        fallbackReason: stage.dataset.fallbackReason,
      }));
      assert.equal(errorState.mediaMode, "fallback");
      assert.equal(errorState.fallbackReason, "media-error");
    } finally {
      await errorPage.close();
    }

    console.log("webkit slow mobile video recovery checks passed");
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
