import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { gsap } from 'gsap';
import { Color, MeshBasicMaterial, PointsMaterial, Points, BufferGeometry, BufferAttribute } from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler';
import vertex from './shader/vertexShader.glsl';
import heroVertex from './shader/heroVertexShader.glsl';
import fragment from './shader/fragmentShader.glsl';
import { ShaderMaterial } from 'three';

class Model {
    constructor(obj) {
        this.name = obj.name;
        this.file = obj.file;
        this.scene = obj.scene;
        this.placeOnLoad = obj.placeOnLoad;
        this.isHero = obj.isHero; // New property

        this.isActive = false;

        this.color1 = obj.color1;
        this.color2 = obj.color2;

        this.loader = new GLTFLoader();
        this.dracoLoader = new DRACOLoader();
        this.dracoLoader.setDecoderPath('/draco/draco/');
        this.loader.setDRACOLoader(this.dracoLoader);

        this.initialPressed = obj.pressed || 0;

        this.init();
    }

    init() {
        if (this.file) {
            this.loader.load(this.file, (response) => {
                // original mesh
                this.mesh = response.scene.children[0];

                // material mesh
                this.material = new MeshBasicMaterial({
                    color: 'red',
                    wireframe: true,
                })
                this.mesh.material = this.material;

                // Geometry Mesh
                this.geometryMesh = this.mesh.geometry;

                this.initParticlesFromMesh();
            });
        } else {
            this.initProceduralParticles();
        }
    }

    initParticlesFromMesh() {
        // Use sampler for model-based particles
        const sampler = new MeshSurfaceSampler(this.mesh).build();
        const numParticles = this.isHero ? 100000 : 20000;
        const particlePositions = new Float32Array(numParticles * 3);

        for (let i = 0; i < numParticles; i++) {
            const newPosition = new THREE.Vector3();
            sampler.sample(newPosition);
            particlePositions.set([newPosition.x, newPosition.y, newPosition.z], i * 3);
        }

        this.createParticles(particlePositions);
    }

    initProceduralParticles() {
        // Procedural particles (for Hero)
        const numParticles = 100000;
        const particlePositions = new Float32Array(numParticles * 3);

        for (let i = 0; i < numParticles; i++) {
            // Initialize at center or random, shader will handle positioning
            particlePositions.set([
                (Math.random() - 0.5) * 1.0,
                (Math.random() - 0.5) * 1.0,
                (Math.random() - 0.5) * 1.0
            ], i * 3);
        }

        this.createParticles(particlePositions);
    }

    createParticles(positions) {
        this.particleMaterial = new ShaderMaterial({
            uniforms: {
                uColor1: { value: new Color(this.color1) },
                uColor2: { value: new Color(this.color2) },
                uTime: { value: 0 },
                uScale: { value: 0 },
                uDispersion: { value: 0 },
                pressed: { value: this.initialPressed },
            },
            vertexShader: this.isHero ? heroVertex : vertex,
            fragmentShader: fragment,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });

        const numParticles = positions.length / 3;
        this.particleGeometry = new BufferGeometry();
        this.particleGeometry.setAttribute('position', new BufferAttribute(positions, 3));

        const particleRandomness = new Float32Array(numParticles * 3);
        for (let i = 0; i < numParticles; i++) {
            particleRandomness.set([
                Math.random() * 2 - 1, // -1 ~ 1
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
            ], i * 3);
        }
        this.particleGeometry.setAttribute('aRandom', new BufferAttribute(particleRandomness, 3));

        //particles
        this.particles = new Points(this.particleGeometry, this.particleMaterial);

        if (this.mesh) {
            this.particles.scale.copy(this.mesh.scale);
            this.particles.position.copy(this.mesh.position);
            this.particles.rotation.copy(this.mesh.rotation);
        }

        // placeOnLoad
        if (this.placeOnLoad) {
            this.add();
        }
    }
    add() {
        gsap.killTweensOf(this.particleMaterial.uniforms.uScale);
        gsap.killTweensOf(this.particles.rotation);

        this.scene.add(this.particles);
        gsap.to(this.particleMaterial.uniforms.uScale, {
            value: 1,
            duration: 1,
            ease: 'power2.out',
        });

        gsap.to(this.particles.rotation, {
            y: 0,
            duration: 1,
            ease: 'power2.out',
        });
        this.isActive = true;
    }

    remove() {
        gsap.killTweensOf(this.particleMaterial.uniforms.uScale);
        gsap.killTweensOf(this.particles.rotation);

        gsap.to(this.particleMaterial.uniforms.uScale, {
            value: 0,
            duration: 1,
            ease: 'power2.out',
            onComplete: () => {
                this.scene.remove(this.particles);
                this.isActive = false;
            }
        });

        gsap.to(this.particles.rotation, {
            y: Math.PI,
            duration: 1,
            ease: 'power2.out',
        });
    }

    pressed() {
        gsap.to(this.particleMaterial.uniforms.pressed, {
            value: 1.2,
            duration: 1,
            ease: 'power2.out',
        });
    }

    disperse() {
        if (!this.isActive) return;
        gsap.to(this.particleMaterial.uniforms.uDispersion, {
            value: 1,
            duration: 1.5,
            ease: 'power2.out',
        });
        gsap.to(this.particles.rotation, {
            x: Math.random() * Math.PI,
            y: Math.random() * Math.PI,
            duration: 1.5,
            ease: 'power2.out',
        });
    }

    assemble() {
        if (!this.isActive) return;
        gsap.to(this.particleMaterial.uniforms.uDispersion, {
            value: 0,
            duration: 1.5,
            ease: 'power2.out',
        });
        gsap.to(this.particles.rotation, {
            x: 0,
            y: 0,
            duration: 1.5,
            ease: 'power2.out',
        });
    }
}

export default Model;