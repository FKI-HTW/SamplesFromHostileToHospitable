
import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, WebGLRenderer } from "three";

import ARManager from '../ARManager';
import { importJSON, JSONDataItem } from "../DataParser";

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

        this.arManager = new ARManager(this.renderer, this.camera, cube);

        window.addEventListener("resize", this.resize, false);

        this.renderer.setAnimationLoop(this.update);

        // Test load data
        this.start();
    }

    private async start(){
        this.loadedJSON =  await this.loadExternalData(0);
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
            return json as JSONDataItem;
        } catch (error) {
            console.error("Error why loading external data:", error);
            return null;
        }
    }
}

export default GameScene;
