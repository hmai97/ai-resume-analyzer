export interface PdfConversionResult {
    imageUrl: string;
    file: File | null;
    error?: string;
}

let pdfjsLib: any = null;
let isLoading = false;
let loadPromise: Promise<any> | null = null;

async function loadPdfJs(): Promise<any> {
    if (pdfjsLib) return pdfjsLib;
    if (loadPromise) return loadPromise;

    isLoading = true;
    // Dynamically import pdfjs (ESM build) via the package entry for better bundler resolution
    loadPromise = import("pdfjs-dist").then((lib) => {
        try {
            // pdfjs-dist v5 prefers providing a Worker instance via workerPort (module workers)
            // Ensure the worker version matches the installed API by resolving from the package itself.
            if (typeof window !== "undefined" && "Worker" in window) {
                try {
                    const workerUrl = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url);
                    const worker = new Worker(workerUrl, { type: "module" as any });
                    // @ts-ignore - workerPort exists at runtime in v5
                    lib.GlobalWorkerOptions.workerPort = worker;
                } catch (e) {
                    // Fallback to legacy workerSrc for environments that don't support module workers
                    const workerUrl = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url);
                    // @ts-ignore - workerSrc still accepted in some builds
                    lib.GlobalWorkerOptions.workerSrc = workerUrl.toString();
                }
            } else {
                // Server-side or no Worker support: let pdf.js fall back to no-worker (slower, but functional)
                // No special setup here.
            }
        } catch (_) {
            // As a last resort, try setting workerSrc which older builds recognize
            const workerUrl = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url);
            // @ts-ignore
            lib.GlobalWorkerOptions.workerSrc = workerUrl.toString();
        }
        pdfjsLib = lib;
        isLoading = false;
        return lib;
    });

    return loadPromise;
}

export async function convertPdfToImage(
    file: File
): Promise<PdfConversionResult> {
    try {
        const lib = await loadPdfJs();

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = lib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        if (!pdf || typeof pdf.numPages !== "number" || pdf.numPages < 1) {
            return { imageUrl: "", file: null, error: "PDF has no pages" };
        }
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 4 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) {
            return { imageUrl: "", file: null, error: "Unable to create 2D canvas context" };
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";

        await page.render({ canvasContext: context, viewport }).promise;

        return new Promise((resolve) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        // Create a File from the blob with the same name as the pdf
                        const originalName = file.name.replace(/\.pdf$/i, "");
                        const imageFile = new File([blob], `${originalName}.png`, {
                            type: "image/png",
                        });

                        resolve({
                            imageUrl: URL.createObjectURL(blob),
                            file: imageFile,
                        });
                    } else {
                        resolve({
                            imageUrl: "",
                            file: null,
                            error: "Failed to create image blob",
                        });
                    }
                },
                "image/png",
                1.0
            ); // Set quality to maximum (1.0)
        });
    } catch (err: any) {
        const message = err?.message || String(err);
        return {
            imageUrl: "",
            file: null,
            error: `Failed to convert PDF: ${message}`,
        };
    }
}