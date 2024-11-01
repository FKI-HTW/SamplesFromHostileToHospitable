// Usage
// const animationSequence = new AnimationSequence();
// animationSequence.start();

import * as THREE from 'three';
import { AnimationMixer, Clock, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';

export default class Timeline {
    private json: String;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    gltfLoader: GLTFLoader;
    renderer: WebGLRenderer;
    mainModelPath: String | undefined;
    // Time stuff
    mixer: AnimationMixer | undefined;
    clock: Clock = new Clock();

    // Timeline
    events = [
        { time: 1, action: () => {} }
      ];
    lastTime: number;

    constructor(json: String, scene: Scene, camera: PerspectiveCamera, gltfLoader: GLTFLoader, renderer: WebGLRenderer) {
    this.json = json;
    this.scene = scene;
    this.camera = camera;
    this.gltfLoader = gltfLoader;
    this.renderer = renderer;

    // Time stuff
    this.mixer; // for animations
    this.clock = new THREE.Clock();
    this.lastTime = 0;

    
    this.bindMethods();
  }

  bindMethods() {
    this.loadDataFromJSON = this.loadDataFromJSON.bind(this);
    this.loadSchablone = this.loadSchablone.bind(this);
    this.start = this.start.bind(this);
    this.loadModel = this.loadModel.bind(this);
    this.loadMainModel = this.loadMainModel.bind(this);
    this.eventAfterLoad = this.eventAfterLoad.bind(this);
    this.assignToParent = this.assignToParent.bind(this);
    this.fadeModelIn = this.fadeModelIn.bind(this);
    this.fadeModelOut = this.fadeModelOut.bind(this);
    this.playAnimation = this.playAnimation.bind(this);
    this.playAmbientSound = this.playAmbientSound.bind(this);
    this.startVoiceOver = this.startVoiceOver.bind(this);
    this.loadAudio = this.loadAudio.bind(this);
    this.showSubModels = this.showSubModels.bind(this);
    this.addDecorations = this.addDecorations.bind(this);
    this.addDecorationPlane = this.addDecorationPlane.bind(this);
    this.makeModelTransparent = this.makeModelTransparent.bind(this);
    this.wait = this.wait.bind(this);
    this.loadMap = this.loadMap.bind(this);
    this.update = this.update.bind(this);
    this.animate = this.animate.bind(this);  // Achtung: Hier könnte es zu Problemen mit requestAnimationFrame kommen, wenn nicht korrekt gehandhabt
  }
  
  // When the user lands in the AR screen, called in main script
  public whenSessionStart(){
    this.onShowPlaceButton();
  }
  private onShowPlaceButton = () => {
    // TODO show place button
  }

  async loadDataFromJSON() {
    return new Promise((resolve, reject) => {
        try {
            this.schablonePath = this.json["pathSchablone"];
            this.mainModelPath = this.json["pathModel"];

            this.voiceOversPath = this.json["pathAudioFiles"];
            this.subtitlesPath = this.json["pathSubtitles"];

            // TO delete
            this.subtitles = this.json["subtitlesAudio"];
            this.subtitlesDurations = this.json["subtitlesDurations"];

            this.ambientSoundPath = this.json["pathAmbientSound"];
            this.decorationsPath = this.json["pathDecoration"];

            resolve(); // Resolve the promise when done
        } catch (error) {
            reject(error); // Reject the promise if an error occurs
        }
    });
}


  loadModel(modelPath) {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(modelPath, (gltf) => {
        resolve(gltf); // Erfolg: Promise mit dem geladenen GLTF auflösen
      }, undefined, (error) => {
        reject(error); // Fehler: Promise mit dem Fehler ablehnen
      });
    });
  }
  

  async loadSchablone(scale = 1) {
    try {
      const loadedObj = await this.loadModel(this.schablonePath); // Warte auf das Laden des Modells mit der neuen asynchronen Funktion
      this.schablone = loadedObj.scene;
      this.schablone.name = "Schablone";
      this.camera.parent.add(this.schablone);
  
      let offset = new THREE.Vector3(0, -1.3, -4);
      this.schablone.position.copy(offset);
  
      this.makeModelTransparent(this.schablone, 0.6);
      this.schablone.visible = false;
  
      console.log("Schablone loaded " + this.schablone.name);
      // Rückgabe oder weitere Verarbeitung hier
      if(scale !== 1){
        this.schablone.scale.set(scale, scale, scale);
      }
    } catch (error) {
      console.error("Fehler beim Laden der Schablone:", error);
      // Fehlerbehandlung hier
    }
  }

  async loadMainModel(targetScale = 1) {
    try {
      const gltf = await this.loadModel(this.mainModelPath); // Warte auf das Laden des Modells mit der neuen asynchronen Funktion
      this.mainModel = gltf;

      let schabloneTransform = new THREE.Matrix4();
      schabloneTransform.makeTranslation(0, 0, -5); // Adjust the value as needed to position in front of the camera
      schabloneTransform.multiplyMatrices(this.camera.matrixWorld, schabloneTransform); // This applies the camera's current position and orientation
      if (this.schablone != null) {
        schabloneTransform = this.schablone.matrix;
        this.schablone.visible = false;
      }

      // Position stuff
      this.mainModel.scene.position.setFromMatrixPosition(schabloneTransform);

      // Rotation stuff
      const recticleMatrix = new THREE.Matrix4();
      recticleMatrix.extractRotation(schabloneTransform);
      this.mainModel.scene.quaternion.setFromRotationMatrix(recticleMatrix);

      let scale = targetScale;
      this.mainModel.scene.scale.set(scale, scale, scale);
      // this.mainModel.scene.name = this.json["spotName"];
      this.scene.add(this.mainModel.scene);

      this.eventAfterLoad(); // Aufruf der Callback-Funktion nach dem Laden
      } catch (error) {
        console.error("Fehler beim Laden des Hauptmodells:", error);
        // Fehlerbehandlung hier
      }
  }

  eventAfterLoad(){
    // Loading Bar
    UI_ScenePlacer.placeLoadingBar();
    this.updateProgressBar(this.loadingBarTime * 1000);
  }

  assignToParent(child, parent, maintainOffset = false) {
    if (maintainOffset) {
      // Direkt die Welttransformation auf das Kind anwenden, bevor es zum Parent hinzugefügt wird
      child.position.setFromMatrixPosition(child.matrixWorld);
      child.rotation.setFromRotationMatrix(child.matrixWorld);
      child.scale.setFromMatrixScale(child.matrixWorld);
    }
  
    // Das Kind zum Parent hinzufügen
    parent.add(child);
  }
  
  

  fadeModelIn(fadeTime = 5) {
    fadeTime *= 1000;
    const modelFader = new ModelFader(this.renderer, this.scene, this.camera, this.mainModel.scene, fadeTime);
    modelFader.startFadeAnimation();
  }

  playAnimation(loop = true, animObj = this.mainModel, animIndex = -1) {
    if (animObj && animObj.animations && animObj.animations.length > 0) {
      const animations = animObj.animations;
      this.mixer = new THREE.AnimationMixer(animObj.scene);
      const animationClips = animations.map((clip) => THREE.AnimationClip.findByName(animations, clip.name));
      
      if(animIndex != -1){
        startAnim(animationClips[animIndex], this.mixer);
        return;
      }

      animationClips.forEach((clip) => {
        startAnim(clip, this.mixer);
      });

      function startAnim(clip, mixer){
        const action = mixer.clipAction(clip);
        action.loop = loop ? THREE.LoopRepeat : THREE.LoopOnce;
        action.clampWhenFinished = true;
        action.enabled = true;
        action.setEffectiveTimeScale(1);
        action.play();
      }
    }
  }

  // TODO needed?
  playSingleAnimation(child){
    const mixer = new THREE.AnimationMixer(child);
    child.animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      action.loop = loop ? THREE.LoopRepeat : THREE.LoopOnce;
      
      action.enabled = true;
      action.setEffectiveTimeScale(1);
      action.play();
    });
  }
  

  async playAmbientSound() {
    if(this.ambientSoundPath == null) return;

    let loadedSound = await this.loadAudio(this.ambientSoundPath);
    loadedSound.play();
  }

  async startVoiceOver(index, withSubs = true) {
    if (this.voiceOversPath !== "") {
      try {
        let previousVoiceOver = this.currentVoiceOver;
        this.currentVoiceOver = await prepareAudio(this.voiceOversPath[index]);

        if(previousVoiceOver == this.currentVoiceOver)
          console.warn("same voice over");
        else
          console.warn("new voice over");

        if (this.currentVoiceOver != null) {
          this.currentVoiceOver.play();
          if(withSubs && this.subtitlesPath !== ""){
            await addSubtitles(this.currentVoiceOver, this.subtitlesPath[index]);
          } 
        }
      } catch (error) {
        console.error('Error preparing audio:', error);
        return;
      }
    }
  }
  
  async loadAudio(path) {
    let audio = null;
    try {
      audio = await prepareAudio(path);
    } catch (error) {
      console.error('Error preparing audio:', error);
      return;
    }
    
    return audio;
  }

  addDecorations(){
    if(this.decorationsPath === "" && this.decorationsPath.length === 0) return;

    this.decorator = new DecorationInstantiator(this.scene, this.gltfLoader, 20, this.decorationsPath, this.mainModel.scene);
    this.decorator.orbitInstantiatorObject();
    this.decorator.raycastForInstantiation();
    // decorator.grow(); // TODO test without
  }

  addDecorationsOnPlane(width, height, center, maxAmount){
    this.decorator = new DecorationInstantiator(this.scene, this.gltfLoader, maxAmount, this.decorationsPath, this.mainModel.scene, width, height, center);
    this.decorator.moveSphereRandomlyAroundPlane();
    this.decorator.raycastForInstantiation();
  }
  addDecorationsOnMesh(mesh, modelPath, intervalX, durationY){
    const decorator = new meshDecorator(mesh, this.scene, modelPath, intervalX, durationY);
    decorator.start();
  }

  addDecorationPlane(path, size){
    if(!this.mainModel) return;

    this.decorationPlane = new planeRaycaster(this.scene, this.camera, this.renderer, this.mainModel.scene, path, this.gltfLoader, size);
    console.log("rayPlane ADDED");
  }

  // Paramater needs a .scene object
  makeModelTransparent(model, transparency = 0.5){
    model.traverse((node) => {
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
    if(this.mixer){
      // TODO make this smarter again
      // this.mixer.update(this.clock.getDelta()); 
      this.mixer.update(1/60); 
    }
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    const elapsedTime = this.clock.getElapsedTime();
    this.update(elapsedTime);
    this.renderer.render(this.scene, this.camera);
  }

  start() {
    this.animate();
  }

}



