/*
 * AMBIENT AUDIO ENGINE — Focus Mode
 *
 * Categories are folders under assets/audio/<category>/,
 * each with a manifest.json listing its own filenames.
 * Playback picks a random track from the active category's
 * manifest, and picks a new random one each time a track ends.
 *
 * "silence" is a built-in pseudo-category meaning no audio.
 */

const audioElement = new Audio();
audioElement.loop = false;

let currentCategory = "silence";
let currentManifest = [];
let currentVolume = 0.5;

audioElement.addEventListener("ended", () => {

  if (currentCategory !== "silence") {

    playRandomTrack();

  }

});


export async function setAmbientCategory(category) {

  currentCategory = category;

  audioElement.pause();

  if (category === "silence") {

    return;

  }

  currentManifest =
    await loadManifest(category);

  if (currentManifest.length === 0) {

    console.warn(
      `No tracks found for ambient category "${category}" — ` +
      `add MP3s and list them in assets/audio/${category}/manifest.json`
    );

    return;

  }

  playRandomTrack();

}


async function loadManifest(category) {

  try {

    const response =
      await fetch(`assets/audio/${category}/manifest.json`);

    if (!response.ok) return [];

    const list =
      await response.json();

    return Array.isArray(list) ? list : [];

  } catch (error) {

    console.error(
      `Could not load manifest for "${category}":`,
      error
    );

    return [];

  }

}


function playRandomTrack() {

  if (currentManifest.length === 0) return;

  const filename =
    currentManifest[
      Math.floor(Math.random() * currentManifest.length)
    ];

  audioElement.src =
    `assets/audio/${currentCategory}/${filename}`;

  audioElement.volume = currentVolume;

  audioElement.play().catch(error => {

    /*
     * Autoplay can be blocked until the user has
     * interacted with the page — this is expected
     * the first time, not a bug. Playback resumes
     * fine after any click (e.g. pressing Play).
     */

    console.warn("Ambient audio play blocked:", error);

  });

}


export function pauseAmbient() {

  audioElement.pause();

}


export function resumeAmbient() {

  if (currentCategory === "silence") return;

  audioElement.play().catch(() => {});

}


export function setAmbientVolume(volume) {

  currentVolume = volume;

  audioElement.volume = volume;

}


export function getCurrentCategory() {

  return currentCategory;

}


export function isAmbientPlaying() {

  return !audioElement.paused;

}