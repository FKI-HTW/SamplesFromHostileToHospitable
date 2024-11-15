
import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from "three";

import ARManager from '../ARManager';
import { importJSON, JSONDataItem } from "../DataParser";
import { UI_Injector } from "../UI_Injector";
import Timeline from "../Timeline";

class GameScene {
    private static _instance = new GameScene();
    public static get instance() {
        return this._instance;
    }

    private width: number;
    private height: number;
    private renderer: WebGLRenderer;
    private camera: PerspectiveCamera;

    private readonly scene = new Scene();

    private arManager: ARManager;
    private timeline: Timeline;
    private ui_singleton = UI_Injector.getInstance();

    private loadedJSON: JSONDataItem | null | undefined;

    private constructor() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.renderer = new WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.width, this.height);
        this.renderer.xr.enabled = true;  // Enable XR for AR

        // find target html element
        const targetElement = document.querySelector<HTMLDivElement>("#app");
        if (!targetElement)
            throw "unable to find target element";
        targetElement.appendChild(this.renderer.domElement);
        
        const aspectRatio = this.width / this.height;
        this.camera = new PerspectiveCamera(75, aspectRatio, 0.1, 1000);

        // Debug Cube
        const cube = new Mesh(new BoxGeometry(), new MeshBasicMaterial()); // Placeholder cube
        cube.scale.set(0.2, 0.2, 0.2);
        this.scene.add(cube);

        // Debug UI
        this.ui_singleton.createVerticalButtonLayout(
            [
                { id: 'btn', text: 'Content A', onClick: () => this.prepareData(0) },
                { id: 'btn', text: 'Content B', onClick: () => this.prepareData(1) },
                { id: 'btn', text: 'Content C', onClick: () => this.prepareData(2) }
            ],
            40, // Top-Offset
            60 // Distance between buttons
        );
        
        this.timeline = new Timeline(this.scene, this.camera, this.renderer);
        this.arManager = new ARManager(this.renderer, this.camera, cube);

        window.addEventListener("resize", this.resize, false);

        this.renderer.setAnimationLoop(this.update);
    }

    private async prepareData(index: number){
        this.loadedJSON =  await this.loadExternalData(index);
    }

    private resize = () => {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.renderer.setSize(this.width, this.height);
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
    };

    private update = (_timestamp: number, frame: XRFrame) => {
        this.arManager.trackHitSource(frame);
        this.renderer.render(this.scene, this.camera);
    }

    public prepareAR() {
        this.arManager.setupAR();
    }

    private async loadExternalData(parameterID: number): Promise<JSONDataItem | null> {
        if (isNaN(parameterID) || parameterID < 0) {
            console.error(`Invalid parameterID: ${parameterID}`);
            return null;
        }
    
        try {
            const json = await importJSON(parameterID);
            if (json === null) {
                console.warn(`Not date found for parameterID: ${parameterID}`);
                return null;
            }
    
            console.log(json.pathModel);
            this.TestLoadModel(json.pathModel);
            return json as JSONDataItem;
        } catch (error) {
            console.error("Error why loading external data:", error);
            return null;
        }
    }

    private async TestLoadModel(pathModel: string) {
        const gltf = await this.timeline.loadModel(pathModel);
    
        // Das geladene Modell zur Szene hinzufügen
        const model = gltf.scene;
        this.scene.add(model);
    
        // Platzierung vor der Kamera
        const offset = new Vector3(0, 0, -2); // 2 Einheiten vor der Kamera
        offset.applyQuaternion(this.camera.quaternion); // Transformiere in Weltkoordinaten
        const cameraPosition = this.camera.position.clone(); // Kopiere die Kameraposition
        model.position.copy(cameraPosition).add(offset); // Setze die Modellposition vor der Kamera
    
        // Optional: Rotationsausrichtung des Modells anpassen
        model.quaternion.copy(this.camera.quaternion);
    
        console.log("Modell geladen und vor die Kamera gesetzt:", model);
    }
    
}

export default GameScene;
