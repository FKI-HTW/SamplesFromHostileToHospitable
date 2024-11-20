// Usage
// const timeline = new Timeline();
// timeline.start();

import * as THREE from 'three';
import { AnimationMixer, Clock, Object3D, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/Addons.js';
import { JSONDataItem } from './DataParser';

export default class Timeline {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  gltfLoader: GLTFLoader = new GLTFLoader();
  renderer: WebGLRenderer;
  mainModelPath: string | undefined;
  stencilPath!: string;
  // Time stuff
  mixer: AnimationMixer | undefined;
  clock: Clock = new Clock();

  loadedJSON: JSONDataItem | null | undefined;

  loadedAudios: THREE.Audio[] = [];


  // Timeline
  events = [
    { time: 1, action: () => { console.log(`Hi ${this.loadedJSON?.pathModel}`) } }
  ];
  lastTime: number;

  constructor(scene: Scene, camera: PerspectiveCamera, renderer: WebGLRenderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    // Time stuff
    this.mixer; // for animations
    this.clock = new THREE.Clock();
    this.lastTime = 0
  }

  public setEvents(events: { time: number; action: () => void }[]): void {
    this.events = events;
  }



  // When the user lands in the AR screen, called in main script
  public whenSessionStart() {
    this.onShowPlaceButton();
  }
  private onShowPlaceButton = () => {
    // TODO show place button
  }
  eventAfterLoad() {

  }

  public resetTimeline() {
    this.events = [];

    this.loadedAudios.forEach(audio => {
      if (audio.isPlaying) {
        audio.stop();
      }
    });
    this.loadedAudios = [];

    this.clock = new Clock();
    this.lastTime = 0;

    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer = undefined;
    }

    this.loadedJSON = null;
  }

  public async prepareMedia(json: JSONDataItem): Promise<void> {
    if (!json) return;

    this.loadedJSON = json;


    if (this.loadedJSON?.pathAudioFiles) {
      for (const audioFile of this.loadedJSON.pathAudioFiles) {
        console.log(`Path: ${audioFile.path}, Time: ${audioFile.time}`);
        try {
          const audio = await this.loadAudio(audioFile.path);
          if (audio) {
            this.loadedAudios.push(audio);

            this.events.push(
              { time: audioFile.time, action: () => { audio.play() } }
            )
          }
        } catch (error) {
          console.error(`Fehler beim Laden von ${audioFile.path}`, error);
        }
      }
    }
  }



  loadModel(modelPath: string): Promise<GLTF> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        modelPath,
        (gltf: GLTF) => {
          resolve(gltf);
        },
        undefined,
        (error: unknown) => {
          reject(error);
        }
      );
    });
  }

  assignToParent(child: Object3D, parent: Object3D, maintainOffset: boolean = false) {
    if (maintainOffset) {
      // Direkt die Welttransformation auf das Kind anwenden, bevor es zum Parent hinzugefügt wird
      child.position.setFromMatrixPosition(child.matrixWorld);
      child.rotation.setFromRotationMatrix(child.matrixWorld);
      child.scale.setFromMatrixScale(child.matrixWorld);
    }

    // Add child to parent
    parent.add(child);
  }

  playAnimation(loop = true, animObj: Object3D, animIndex = -1) {
    if (animObj && animObj.animations && animObj.animations.length > 0) {
      const animations = animObj.animations;
      this.mixer = new THREE.AnimationMixer(this.scene);
      const animationClips = animations.map((clip) => THREE.AnimationClip.findByName(animations, clip.name));

      if (animIndex != -1) {
        startAnim(animationClips[animIndex], this.mixer);
        return;
      }

      animationClips.forEach((clip) => {
        startAnim(clip, this.mixer);
      });

      function startAnim(clip: THREE.AnimationClip, mixer: THREE.AnimationMixer | undefined) {
        if (!mixer) return;
        const action = mixer.clipAction(clip);
        action.loop = loop ? THREE.LoopRepeat : THREE.LoopOnce;
        action.clampWhenFinished = true;
        action.enabled = true;
        action.setEffectiveTimeScale(1);
        action.play();
      }
    }
  }

  async loadAudio(path: string): Promise<THREE.Audio | null> {
    let audio: THREE.Audio | null = null; // Typ explizit angeben
    try {
      audio = await this.prepareAudio(path);
    } catch (error) {
      console.error('Error preparing audio:', error);
      return null; // Rückgabe von null bei Fehler
    }

    return audio;
  }



  prepareAudio(audioPath: string): Promise<THREE.Audio> {
    const audioLoader = new THREE.AudioLoader();
    return new Promise((resolve, reject) => {
      const hasAudioExtension = /\.(mp3|wav|m4a)$/.test(audioPath);
      if (hasAudioExtension) {
        audioLoader.load(audioPath, (buffer) => {
          const listener = new THREE.AudioListener();
          const readyAudio = new THREE.Audio(listener);
          readyAudio.setBuffer(buffer);
          readyAudio.isPlaying = false;
          resolve(readyAudio); // Gibt ein THREE.Audio-Objekt zurück
        }, undefined, (err) => {
          reject(err);
        });
      } else {
        reject(new Error('Invalid audio file extension'));
      }
    });
  }


  // Paramater needs a .scene object
  makeModelTransparent(model: any, transparency = 0.5) {
    model.traverse((node: any) => {
      if (node.isMesh) {
        // Check if the node is a mesh
        const materials = Array.isArray(node.material) ? node.material : [node.material];

        // Iterate through the materials of the mesh and make them half transparent
        for (const material of materials) {
          if (material.transparent !== undefined) {
            material.transparent = true;
            material.opacity = transparency;
          }
        }
      }
    });
  }

  async wait(seconds: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, seconds * 1000); // Multiply by 1000 to convert seconds to milliseconds
    });
  }

  //-------------------------------------------------------------
  loadMap() {
    // Implementation
    window.location.href = 'index.html';
  }

  update(time: number) {
    for (const event of this.events) {
      if (this.lastTime < event.time && time >= event.time) {
        event.action();
      }
    }
    this.lastTime = time;

    // Continous stuff
    if (this.mixer) {
      // TODO make this smarter again
      // this.mixer.update(this.clock.getDelta()); 
      this.mixer.update(1 / 60);
    }
  }
  animate = () => {
    requestAnimationFrame(this.animate.bind(this));
    const elapsedTime = this.clock.getElapsedTime();
    this.update(elapsedTime);
    this.renderer.render(this.scene, this.camera);
  }
  start() {
    this.animate();
  }

}



