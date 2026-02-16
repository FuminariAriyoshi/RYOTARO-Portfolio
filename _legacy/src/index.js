import * as THREE from 'three'
import { gsap } from 'gsap';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Model from './model';

/*------------------------------
Renderer
------------------------------*/
const mainSection = document.getElementById('main-section');
let mainRenderer;
if (mainSection) {
  mainRenderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  mainRenderer.setSize(window.innerWidth, window.innerHeight);
  mainSection.appendChild(mainRenderer.domElement);
}

// Hero Renderer
const heroSection = document.getElementById('hero-section');
let heroRenderer;
if (heroSection) {
  heroRenderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  heroRenderer.setSize(window.innerWidth, window.innerHeight);
  heroSection.appendChild(heroRenderer.domElement);
}


/*------------------------------
Scene & Camera
------------------------------*/
// Main Scene
const scene = new THREE.Scene();

// Hero Scene
const heroScene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  40,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.x = 0;
camera.position.z = 5;
camera.position.y = 1;


/*------------------------------
Mesh
------------------------------*/
const geometry = new THREE.BoxGeometry(2, 2, 2);
const material = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
});
const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);


/*------------------------------
OrbitControls
------------------------------*/
// Controls for main scene
let controls;
if (mainRenderer) {
  controls = new OrbitControls(camera, mainRenderer.domElement);
  controls.enableZoom = false;
}

// Controls for hero scene
let heroControls;
if (heroRenderer) {
  heroControls = new OrbitControls(camera, heroRenderer.domElement);
  heroControls.enableZoom = false;
}


/*------------------------------
Helpers
------------------------------*/
// const gridHelper = new THREE.GridHelper(10, 10);
// scene.add(gridHelper);
// const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);

/*------------------------------
Models
------------------------------*/
const water = new Model({
  name: 'water',
  file: './models/water.glb',
  scene: scene,
  color1: 'white',
  color2: 'yellow',
  placeOnLoad: true,
});

const dragon = new Model({
  name: 'dragon',
  file: './models/dragon2.glb',
  scene: scene,
  color1: 'white',
  color2: 'green',
});

const machine = new Model({
  name: 'machine',
  file: './models/machine2.glb',
  scene: scene,
  color1: 'purple',
  color2: 'white',
});

// Hero Model (Machine Particles)
const heroWater = new Model({
  name: 'hero-particles',
  file: './models/dragon2.glb', // No file needed
  scene: heroScene,
  color1: 'purple',
  color2: 'white',
  placeOnLoad: true,
  pressed: 1.2,
  isHero: true,
});



// controllers
// Models array for state management
const models = [water, dragon, machine];
const textElements = document.querySelectorAll('.text');

// Updated imageUrls to array of arrays for multiple images per model
const imageUrls = [
  // Water images
  [
    'https://images.unsplash.com/photo-1547623641-d2c56c03e2a7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1012&q=80',
    'https://images.unsplash.com/photo-1468476396571-4d6f2a427ee7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1012&q=80',
  ],
  // Dragon images
  [
    'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1012&q=80',
    'https://images.unsplash.com/photo-1577493340887-b7bfff550145?ixlib=rb-1.2.1&auto=format&fit=crop&w=1012&q=80',
  ],
  // Machine images
  [
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1012&q=80',
    'https://images.unsplash.com/photo-1517420879524-86d64ac2f339?ixlib=rb-1.2.1&auto=format&fit=crop&w=1012&q=80',
  ]
];

let currentModelIndex = 0;
let currentImageIndex = 0; // Track current image index
let isAnimating = false;

function changeModel(index) {
  if (index === currentModelIndex) return;

  isAnimating = true;

  // Add new model
  models[index].add();

  // Remove other models
  models.forEach((model, i) => {
    if (i !== index) {
      model.remove();
    }
  });

  // Update text visibility
  textElements.forEach((text, i) => {
    if (i === index) {
      gsap.to(text, { opacity: 1, pointerEvents: 'auto', duration: 0.5 });
    } else {
      gsap.to(text, { opacity: 0, pointerEvents: 'none', duration: 0.5 });
    }
  });

  currentModelIndex = index;
  currentImageIndex = 0; // Reset image index on model change

  // Wait for animation (1s duration + 0.3s delay = 1.3s, so 1.5s is safe)
  setTimeout(() => {
    isAnimating = false;
  }, 1500);

  // Update Progress Bar
  if (typeof progressHandler !== 'undefined') {
    progressHandler.sync(index);
  }
}

// Initialize Text
if (textElements.length > 0) {
  gsap.to(textElements[currentModelIndex], { opacity: 1, pointerEvents: 'auto', duration: 0, delay: 0.5 });
}


// Scroll interaction - Only active when Works/Main section exists
if (mainSection) {
  window.addEventListener('wheel', (e) => {
    if (isAnimating) return;

    const viewer = document.getElementById('img-viewer');
    const isActive = gsap.getProperty(viewer, "opacity") > 0.1;

    // If viewer is active, navigate through images
    if (isActive) {
      // Viewer Navigation
      const groups = [
        document.getElementById('waterImage'),
        document.getElementById('dragonImage'),
        document.getElementById('machineImage')
      ];
      const targetGroup = groups[currentModelIndex];
      const images = targetGroup ? targetGroup.querySelectorAll('img') : [];

      if (e.deltaY > 0) {
        // Next Image
        if (currentImageIndex < images.length - 1) {
          currentImageIndex++;
          openViewer(currentModelIndex, false);
        }
      } else {
        // Prev Image
        if (currentImageIndex > 0) {
          currentImageIndex--;
          openViewer(currentModelIndex, false);
        } else {
          closeViewer();
        }
      }
      return; // Stop model switching
    }

    if (e.deltaY > 0) {
      // Scroll down -> next
      let nextIndex = currentModelIndex + 1;
      if (nextIndex >= models.length) nextIndex = 0;
      changeModel(nextIndex);
    } else {
      // Scroll up -> previous
      let nextIndex = currentModelIndex - 1;
      if (nextIndex < 0) nextIndex = models.length - 1;
      changeModel(nextIndex);
    }
  });
}


// Clock
const clock = new THREE.Clock();

/*------------------------------
Loop
------------------------------*/
const animate = function () {
  requestAnimationFrame(animate);

  // Always render Hero (background)
  if (heroRenderer) {
    heroRenderer.render(heroScene, camera);
  }

  if (mainRenderer) {
    mainRenderer.render(scene, camera);
  }


  if (heroWater.isActive) {
    heroWater.particleMaterial.uniforms.uTime.value = clock.getElapsedTime();
  }

  if (water.isActive) {
    water.particleMaterial.uniforms.uTime.value = clock.getElapsedTime();
  }
  if (dragon.isActive) {
    dragon.particleMaterial.uniforms.uTime.value = clock.getElapsedTime();
  }
  if (machine.isActive) {
    machine.particleMaterial.uniforms.uTime.value = clock.getElapsedTime();
  }
};
animate();


/*------------------------------
Resize
------------------------------*/
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  if (mainRenderer) mainRenderer.setSize(window.innerWidth, window.innerHeight);
  if (heroRenderer) heroRenderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize, false);

// mouseMove
function onMouseMove(e) {

  gsap.to(scene.rotation, {
    y: gsap.utils.mapRange(0, window.innerWidth, -2, 2, e.clientX),
    x: gsap.utils.mapRange(0, window.innerHeight, -0.5, 0.5, e.clientY),
  });
}

window.addEventListener('mousemove', onMouseMove);


function exploreHover() {

  const exploreContainer = document.querySelector('.explore-container');
  const arrow = document.querySelector('.arrow');

  exploreContainer.addEventListener('mouseenter', () => {
    gsap.to(exploreContainer, {
      y: -10,
      duration: 0.5,
      ease: 'power2.out',
    })
  });

  exploreContainer.addEventListener('mouseleave', () => {
    gsap.to(exploreContainer, {
      y: 0,
      duration: 0.5,
      ease: 'power2.out',
    })
  });
}



/*------------------------------
Progress Handler
------------------------------*/
class ProgressHandler {
  constructor() {
    this.progress = document.querySelector('.progress');
    this.indicators = [];
    this.mobile = 786;
    this.barCount = models.length;
    this.count = models.length;
    this.userInteractionsEnabled = true;
    this.isDragging = false;
    this.revealThreshold = -1;

    this.init();
  }

  init() {
    if (!this.progress) return;
    this.progress.innerHTML = '';
    this.indicators = [];

    for (let i = 0; i < this.barCount; i++) {
      const div = document.createElement('div');
      div.classList.add('progress-indicator');
      this.progress.appendChild(div);
      this.indicators.push({ el: div });
    }

    this.isDragging = false;

    // Mouse (Hover interaction)
    this.progress.addEventListener('mouseenter', (e) => this.onPointerDown(e));
    this.progress.addEventListener('mouseleave', () => this.onPointerUp());
    this.progress.addEventListener('mousemove', (e) => this.onPointerMove(e));

    // Touch (Drag interaction)
    this.progress.addEventListener('touchstart', (e) => this.onPointerDown(e.touches[0]));
    window.addEventListener('touchmove', (e) => {
      if (this.isDragging) this.onPointerMove(e.touches[0] || e);
    }, { passive: false });
    window.addEventListener('touchend', () => this.onPointerUp());

    // Initial Update
    this.sync(currentModelIndex);
  }

  onPointerDown(e) {
    if (!this.userInteractionsEnabled) return;
    this.isDragging = true;
    this.updateDrag(e);
  }

  onPointerMove(e) {
    if (!this.isDragging) return;
    this.updateDrag(e);
  }

  onPointerUp() {
    if (!this.isDragging) return;
    this.isDragging = false;
  }

  updateDrag(e) {
    const rect = this.progress.getBoundingClientRect();
    let ratio;

    if (window.innerWidth > this.mobile) {
      ratio = (e.clientX - rect.left) / rect.width;
    } else {
      ratio = (e.clientY - rect.top) / rect.height;
    }

    ratio = Math.max(0, Math.min(1, ratio));

    // Calculate model index
    const targetIndex = Math.round(ratio * (this.count - 1));

    // Update UI
    const barIndex = Math.round(ratio * (this.barCount - 1));
    this.updateProgressUI(barIndex);

    // Update Page Number
    const pageNum = document.getElementById('current-page');
    if (pageNum) {
      pageNum.innerText = (targetIndex % this.count) + 1;
    }

    // Change Model if changed
    if (targetIndex !== currentModelIndex) {
      changeModel(targetIndex);
    }
  }

  // Called externally when model changes via scroll
  sync(index) {
    const ratio = index / (this.count - 1);
    const barIndex = Math.round(ratio * (this.barCount - 1));
    this.updateProgressUI(barIndex);

    // Update Page Number
    const pageNum = document.getElementById('current-page');
    if (pageNum) {
      pageNum.innerText = (index % this.count) + 1;
    }
  }

  updateProgressUI(index) {
    if (!this.indicators) return;

    const count = this.indicators.length;
    const activeSpread = 10;
    const edgeSpread = 8;

    const getGauss = (dist, spread) => {
      if (dist > spread) return 0;
      const sigma = spread / 2.5;
      return Math.exp(-(dist * dist) / (2 * sigma * sigma));
    };

    const getQuad = (dist, spread) => {
      if (dist > spread) return 0;
      return Math.pow(1 - dist / spread, 2);
    };

    this.indicators.forEach((item, i) => {
      const { el } = item;

      // Gaussian distribution for active index
      const distActive = Math.abs(i - index);
      const strActive = getGauss(distActive, activeSpread);

      // Edge effects
      const distStart = Math.abs(i - 0);
      const strStart = getQuad(distStart, edgeSpread);

      const distEnd = Math.abs(i - (count - 1));
      const strEnd = getQuad(distEnd, edgeSpread);

      // Scale calculation (for Height effect)
      let scale = 0.5 + strActive * 0.3;
      scale += strStart * 0.2;
      scale += strEnd * 0.2;

      // Opacity calculation
      let opacity = 0.2 + 0.8 * strActive;

      const isDesktop = window.innerWidth > this.mobile;
      const isActive = i === index;
      const durationTime = 1.;

      if (isActive) {
        el.classList.add('active');
        if (isDesktop) {
          gsap.to(el, {
            duration: durationTime,
            width: 21,
            backgroundColor: 'transparent',
            border: '1px solid white',
            scaleY: 1,
            opacity: 1,
            ease: "power2.out"
          });
        } else {
          // Mobile Active
          gsap.to(el, {
            duration: durationTime,
            scaleX: scale,
            scaleY: 1,
            width: 10,
            transformOrigin: 'right center',
            opacity: 1,
            backgroundColor: 'white',
            border: 'none',
            ease: "power2.out"
          });
        }
      } else {
        el.classList.remove('active');
        if (isDesktop) {
          // Inactive Line
          gsap.to(el, {
            duration: durationTime,
            width: 1,
            backgroundColor: 'white',
            border: 'none',
            scaleY: scale,
            opacity: opacity,
            ease: "power2.out"
          });
        } else {
          // Mobile Inactive
          gsap.to(el, {
            duration: durationTime,
            scaleX: scale,
            scaleY: 1,
            width: 10,
            transformOrigin: 'right center',
            opacity: opacity,
            backgroundColor: 'white',
            border: 'none',
            ease: "power2.out"
          });
        }
      }
    });
  }
}

const progressHandler = new ProgressHandler();



// function to animate image switching
function switchImage(group, targetIndex) {
  const slider = group.querySelector('.images-slider');
  if (!slider) return;

  const images = slider.querySelectorAll('img');
  // Ensure all images are visible and layout is calculated
  images.forEach(img => gsap.set(img, { display: 'block', opacity: 1 }));

  const targetImage = images[targetIndex];
  if (!targetImage) return;

  // Calculate position to center the target image
  // We need to wait for layout? For now assume valid dimensions
  const wrapperHeight = group.offsetHeight || window.innerHeight; // approximate
  const targetTop = targetImage.offsetTop;
  const targetHeight = targetImage.offsetHeight;

  const moveY = (wrapperHeight / 2) - (targetTop + targetHeight / 2);

  gsap.to(slider, {
    y: moveY,
    duration: 1,
    ease: 'power2.out',
    overwrite: true
  });
}

// image viewer
let isOpeningViewer = false;
function openViewer(index, autoCycle = true) {
  const viewer = document.getElementById('img-viewer');
  const line = document.querySelector('.overview-line');
  if (!viewer) return; // Guard

  /* Update content selection logic for grouped images */
  const groups = [
    document.getElementById('waterImage'),
    document.getElementById('dragonImage'),
    document.getElementById('machineImage')
  ];

  const currentOpacity = gsap.getProperty(viewer, "opacity");
  // Check if fully active. If closing (opacity dropping) or opening, treat as inactive to force animation?
  // If we want to support "switching while opening", we need careful logic.
  // But for now, if opacity < 0.9, assume we need to animate/open it.
  const isActive = currentOpacity > 0.9;

  if (!isActive && isOpeningViewer) return;

  // Manage Image Index Cycling
  const targetGroup = groups[index];
  if (targetGroup) {
    const images = targetGroup.querySelectorAll('img');

    if (isActive) {
      if (autoCycle) {
        // Already open, cycle to next image
        currentImageIndex++;
        if (currentImageIndex >= images.length) {
          currentImageIndex = 0;
        }
      }
      // If !autoCycle, keep currentImageIndex (manipulated externally)
    } else {
      // Just opening
      isOpeningViewer = true;
      currentImageIndex = 0;
    }
  }

  // Ensure correct display for all groups
  groups.forEach((group, i) => {
    if (!group) return;
    if (i !== index) {
      gsap.set(group, { display: 'none', autoAlpha: 0 });
    } else {
      gsap.set(group, { display: 'block', autoAlpha: 1 });

      // If we are just opening (!isActive), we might need to set initial position immediately
      if (!isActive) {
        const slider = group.querySelector('.images-slider');
        const images = slider ? slider.querySelectorAll('img') : [];
        if (images.length > 0 && slider) {
          // Ensure images are visible for calculation
          images.forEach(img => gsap.set(img, { display: 'block', opacity: 1 }));

          const targetImage = images[0];
          const wrapperHeight = group.offsetHeight || window.innerHeight;
          // approximation if display: none
          const targetTop = targetImage.offsetTop || 0;
          const targetHeight = targetImage.offsetHeight || 0;

          // If values are 0 (due to display none previously), this might be off.
          // However, we just set display: block on group.

          const moveY = (wrapperHeight / 2) - (targetTop + targetHeight / 2);
          gsap.set(slider, { y: moveY });
        }
      }
    }
  });

  if (isActive) {
    switchImage(targetGroup, currentImageIndex);
    updateOverviewLine(index, currentImageIndex);

  } else {
    // Open Animation Logic follows below
    // Note: models[index].disperse() and GSAP animations are after this block
  }

  viewer.classList.remove('hidden');

  if (!isActive) {
    // Particle animation - triggered only on open
    try {
      models[index].disperse();
    } catch (e) { }

    // Animate Explore Container Up
    const exploreContainer = document.querySelector('.explore-container');
    if (exploreContainer) {
      gsap.to(exploreContainer, {
        opacity: 0,
        duration: 0.1, // Quick fade out
        ease: "power2.out"
      });
    }
  }

  // Overview
  const overview = document.querySelector('.overview');
  const overViewImages = document.querySelectorAll('.overview-img');

  if (overview) {
    const overviewGroups = [
      document.getElementById('waterOverview'),
      document.getElementById('dragonOverview'),
      document.getElementById('machineOverview')
    ];

    overviewGroups.forEach((group, i) => {
      if (!group) return;
      if (i === index) {
        gsap.set(group, { display: 'flex', autoAlpha: 1 });
      } else {
        gsap.set(group, { display: 'none', autoAlpha: 0 });
      }
    });

    // Clear transforms to ensure accurate layout calculation
    gsap.set('.overview-img', { y: 0 });
    gsap.set('.overview-line', { y: 0, yPercent: -50 });

    // Update Overview Line
    // If not active (opening), we want to set it immediately so the slide-up animation works cleanly.
    updateOverviewLine(index, currentImageIndex, !isActive);

    if (!isActive) {
      const activeGroup = overviewGroups[index];
      const activeImages = activeGroup ? activeGroup.querySelectorAll('img') : [];
      const ease = 'expo.out';
      const durationTime = 1.5;

      gsap.fromTo(viewer, {
        y: window.innerHeight,
        opacity: 0,
      }, {
        y: 0,
        duration: durationTime,
        opacity: 1,
        visibility: 'visible',
        pointerEvents: 'auto',
        ease: ease,
        onComplete: () => {
          isOpeningViewer = false;
        }
      });

      gsap.fromTo(overview, {
        opacity: 0,
      }, {
        duration: durationTime,
        opacity: 1,
        visibility: 'visible',
        pointerEvents: 'auto',
        ease: ease
      });

      if (activeGroup && activeImages.length > 0) {
        // Collect all elements to animate: Images first, then line
        const elementsToAnimate = [...Array.from(activeImages), line];

        gsap.fromTo(elementsToAnimate, {
          y: window.innerHeight,
          opacity: 0
        }, {
          duration: durationTime,
          y: 0,
          opacity: (i, target) => target === line ? 0.8 : 1,
          ease: ease,
          stagger: 0.008,
          onStart: () => {
            if (activeGroup) activeGroup.style.overflowY = 'visible';
          },
          onComplete: () => {
            if (activeGroup) activeGroup.style.overflowY = 'visible';
          }
        });
      }
    }
  }
}

function closeViewer() {
  const viewer = document.getElementById('img-viewer');
  if (!viewer) return;

  // Kill running animations immediately!
  isOpeningViewer = false;
  gsap.killTweensOf(viewer);
  gsap.killTweensOf('.overview-line');
  gsap.killTweensOf('.overview-img');
  gsap.killTweensOf('.overview');
  gsap.killTweensOf('.explore-container');
  gsap.killTweensOf('.explore');
  gsap.killTweensOf('.arrow');

  const line = document.querySelector('.overview-line');
  if (line) {
    gsap.to(line, { opacity: 0, duration: 0.5 });
  }

  // Restore Hero Content
  const heroText = document.querySelectorAll('.text');
  const heroSection = document.getElementById('hero-section');

  if (heroSection) {
    gsap.to(heroSection, { opacity: 1, duration: 0.5 });
  }

  gsap.to(viewer, {
    duration: 0.5,
    opacity: 0,
    pointerEvents: 'none',
    ease: 'power2.out',
    onComplete: () => {
      viewer.style.visibility = 'hidden';
    }
  });

  // UI animation - Reset Explore Container
  const exploreContainer = document.querySelector('.explore-container');
  const exploreText = document.querySelector('.explore');
  const arrow = document.querySelector('.arrow');
  const durationTime = 1.;
  gsap.to(exploreContainer, {
    opacity: 1,
  });
  gsap.fromTo(exploreText, {
    y: 80,
    opacity: 1
  }, {
    y: 0,
    duration: durationTime,
    ease: "power2.out"
  });

  gsap.fromTo(arrow, {
    y: 90,
    opacity: 1
  },
    {
      y: 0,
      duration: durationTime,
      ease: "power2.out"
    })


  // Particle animation
  models[currentModelIndex].assemble();

  currentImageIndex = 0; // Reset on close
  // Close Overview
  const overview = document.querySelector('.overview');
  if (overview) {
    gsap.to(overview, {
      duration: 0.5,
      opacity: 0,
      pointerEvents: 'none',
      ease: 'power2.out',
      onComplete: () => {
        overview.style.visibility = 'hidden';
      }
    });
  }
}

function updateOverviewLine(modelIndex, imageIndex, immediate = false) {
  const line = document.querySelector('.overview-line');
  const overviewGroups = [
    document.getElementById('waterOverview'),
    document.getElementById('dragonOverview'),
    document.getElementById('machineOverview')
  ];
  const activeGroup = overviewGroups[modelIndex];
  if (!activeGroup || !line) return;

  const images = activeGroup.querySelectorAll('.overview-img');
  if (images.length === 0) return;

  const idx = Math.min(Math.max(imageIndex, 0), images.length - 1);
  const targetImage = images[idx];

  if (targetImage) {
    const rect = targetImage.getBoundingClientRect();
    const centerY = rect.top + (rect.height / 2);

    if (immediate) {
      gsap.set(line, {
        width: rect.width + 10,
        height: rect.height + 10,
        top: centerY
      });
    } else {
      gsap.to(line, {
        width: rect.width + 10,
        height: rect.height + 10,
        top: centerY,
        duration: 0.8,
        ease: 'power3.out'
      });
    }
  }
}


function pressed() {
  models[currentModelIndex].pressed();
}



let isDraggingScene = false;
let startX = 0;
let startY = 0;
let startTime = 0;

window.addEventListener('mousedown', (e) => {
  isDraggingScene = false;
  startX = e.clientX;
  startY = e.clientY;
  startTime = Date.now();
  console.log('Mousedown fired, startTime:', startTime);
}, true); // Use capture to ensure we catch it

window.addEventListener('touchstart', (e) => {
  isDraggingScene = false;
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
  startTime = Date.now();
  console.log('Touchstart fired, startTime:', startTime);
}, { passive: false, capture: true });

// Click interaction
const exploreBtn = document.querySelector('.explore-container');
if (exploreBtn) {
  exploreBtn.addEventListener('click', (e) => {
    openViewer(currentModelIndex);
  });

  exploreBtn.addEventListener('mouseenter', () => {
    animateExploreHover(true);
  });

  exploreBtn.addEventListener('mouseleave', () => {
    animateExploreHover(false);
  });
}

function animateExploreHover(isHovering) {
  const arrow = document.querySelector('.arrow');
  const text = document.querySelector('.explore');

  if (isHovering) {

    gsap.to(arrow, {
      y: 3,
      duration: 0.3,
      ease: "power2.out"
    });

  } else {
    // Leave Animation
    gsap.to(arrow, {
      y: 0,
      duration: 0.3,
      ease: "power2.out"
    });
  }
}


// Key interaction for "Down Arrow"

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    const viewer = document.getElementById('img-viewer');
    const isActive = gsap.getProperty(viewer, "opacity") > 0.1;

    if (isActive) {
      // Viewer Navigation (Change Images)
      const groups = [
        document.getElementById('waterImage'),
        document.getElementById('dragonImage'),
        document.getElementById('machineImage')
      ];
      const targetGroup = groups[currentModelIndex];
      const images = targetGroup ? targetGroup.querySelectorAll('img') : [];

      if (e.key === 'ArrowRight') {
        // Next Image
        if (currentImageIndex < images.length - 1) {
          currentImageIndex++;
          openViewer(currentModelIndex, false);
        }
      } else {
        // Prev Image
        if (currentImageIndex > 0) {
          currentImageIndex--;
          openViewer(currentModelIndex, false);
        }
      }
    } else {
      // Main Navigation (Change Models)
      if (e.key === 'ArrowRight') {
        let nextIndex = currentModelIndex + 1;
        if (nextIndex >= models.length) nextIndex = 0;
        changeModel(nextIndex);
      } else {
        let nextIndex = currentModelIndex - 1;
        if (nextIndex < 0) nextIndex = models.length - 1;
        changeModel(nextIndex);
      }
    }
  }



  if (e.key === 'ArrowDown') {
    if (mainSection) {
      openViewer(currentModelIndex);
    }
  }

  if (e.key === 'ArrowUp') {
    const viewer = document.getElementById('img-viewer');
    const isActive = gsap.getProperty(viewer, "opacity") > 0.1;

    if (isActive) {
      if (currentImageIndex > 0) {
        currentImageIndex--;
        openViewer(currentModelIndex, false);
      } else {
        closeViewer();
      }
    }
  }
});