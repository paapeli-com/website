export function downloadCanvasImage(canvas: HTMLCanvasElement, filename: string = 'image.png'): void {
    // Create a temporary link element
    const link = document.createElement('a');
    
    // Set the link's href to the canvas image as a data URL
    link.href = canvas.toDataURL('image/png');
    
    // Set the download attribute with the desired filename
    link.download = filename;
    
    // Append the link to the body (required for Firefox)
    document.body.appendChild(link);
    
    // Trigger the download by simulating a click on the link
    link.click();
    
    // Remove the link from the document
    document.body.removeChild(link);
}