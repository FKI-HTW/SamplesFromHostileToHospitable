// Path to json file
const jsonFilePath = "database.json";

export interface JSONDataItem {
    ID: number;
    contentName: string;
    pathModel: string;
    pathStencil: string;
    pathAudioFiles: AudioFile[];
}

interface AudioFile {
    path: string;
    time: number;
}


export async function importJSON(index: number = -1): Promise<JSONDataItem | null> {
    try {
        const response = await fetch(jsonFilePath);

        if (!response.ok) {
            throw new Error(`error when loading json file: ${response.status}`);
        }

        const data: JSONDataItem[] = await response.json();

        if (index !== -1) {
            // Returns single JSONDataItem, when index is defined
            return data[index] || null; // Returns null, if index outside of reach
        }

        console.warn("No index was passed. The first element is returned");
        return data[0] || null;
    } catch (error) {
        console.error("Error when parsing the json file:", error);
        return null;
    }
}


