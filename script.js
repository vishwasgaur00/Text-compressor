import { HuffmanCoder } from './huffman.js';


onload = function () {
    // Get reference to elements
    const treearea = document.getElementById('treearea');
    const encodeBtn = document.getElementById('encode'); // Renamed from encode
    const decodeBtn = document.getElementById('decode'); // Renamed from decode
    const temptext = document.getElementById('temptext');
    const uploadInput = document.getElementById('uploadedFile'); // Renamed from upload
    const fileDropArea = document.getElementById('fileDropArea'); // New: Drop area element
    const fileNameDisplay = document.getElementById('fileNameDisplay'); // New: File name display
    const operationTimeSpan = document.getElementById('operationTime'); // New: Time display
    const compressionRatioSpan = document.getElementById('compressionRatio'); // New: Ratio display

    const coder = new HuffmanCoder();

    // --- Drag & Drop Functionality ---
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        fileDropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Highlight drop area when dragging over
    ['dragenter', 'dragover'].forEach(eventName => {
        fileDropArea.addEventListener(eventName, highlight, false);
    });

    // Remove highlight when dragging leaves or file is dropped
    ['dragleave', 'drop'].forEach(eventName => {
        fileDropArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        fileDropArea.classList.add('highlight');
    }

    function unhighlight() {
        fileDropArea.classList.remove('highlight');
    }

    // Handle dropped files
    fileDropArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    // --- File Input Change Listener (for manual selection via label/button) ---
    uploadInput.addEventListener('change', () => {
        handleFiles(uploadInput.files);
    });

    // Central function to process selected/dropped files
    function handleFiles(files) {
        if (files.length > 0) {
            const uploadedFile = files[0];
            // Assign files to the hidden input's files list for consistent access
            // This is a common trick to make dropped files accessible via the input element
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(uploadedFile);
            uploadInput.files = dataTransfer.files;

            fileNameDisplay.innerText = `Selected File: ${uploadedFile.name}`;
            alert(`File '${uploadedFile.name}' selected and ready!`);
            // Clear previous results/info areas
            treearea.innerText = 'Tree Structure Will Be Displayed Here !!';
            temptext.innerText = 'Operation info will be shown here !!';
            operationTimeSpan.innerText = '';
            compressionRatioSpan.innerText = '';
        }
    }

    // --- Encode Button Click ---
    encodeBtn.onclick = function () {
        const uploadedFile = uploadInput.files[0];
        if (uploadedFile === undefined) {
            alert("No file uploaded! Please select a file first using the button or drag-and-drop.");
            return;
        }

        const fileReader = new FileReader();
        fileReader.onload = function(fileLoadedEvent){
            const text = fileLoadedEvent.target.result;
            if (text.length === 0) {
                alert("Text content is empty! Please upload a file with content.");
                return;
            }

            const startTime = performance.now(); // Start time measurement
            // coder.encode now returns original_length and encoded_length
            let [encoded, tree_structure, original_length, encoded_length, info] = coder.encode(text);
            const endTime = performance.now(); // End time measurement

            const operationTime = (endTime - startTime).toFixed(2); // Time in ms
            // Calculate compression ratio: (Original Size - Compressed Size) / Original Size * 100
            const compressionRatio = ((1 - (encoded_length / original_length)) * 100).toFixed(2);

            downloadFile(uploadedFile.name.split('.')[0] + '_encoded.txt', encoded);
            treearea.innerText = tree_structure;
            treearea.style.marginTop = '0px'; // Reset margin for tree display
            temptext.innerText = info;
            operationTimeSpan.innerText = `Time taken for encoding: ${operationTime} ms`;
            compressionRatioSpan.innerText = `Compression Ratio: ${compressionRatio}% (Original: ${original_length} bytes, Compressed: ${encoded_length} bytes)`;
        };
        fileReader.readAsText(uploadedFile, "UTF-8");
    };

    // --- Decode Button Click ---
    decodeBtn.onclick = function () {
        const uploadedFile = uploadInput.files[0];
        if (uploadedFile === undefined) {
            alert("No file uploaded! Please select an encoded file for decoding.");
            return;
        }

        const fileReader = new FileReader();
        fileReader.onload = function(fileLoadedEvent){
            const text = fileLoadedEvent.target.result;
            if (text.length === 0) {
                alert("Encoded text content is empty! Please upload a file with content.");
                return;
            }

            const startTime = performance.now(); // Start time measurement
            // coder.decode now returns original_encoded_length and decoded_length
            let [decoded, tree_structure, original_encoded_length, decoded_length, info] = coder.decode(text);
            const endTime = performance.now(); // End time measurement

            const operationTime = (endTime - startTime).toFixed(2); // Time in ms

            downloadFile(uploadedFile.name.split('.')[0] + '_decoded.txt', decoded);
            treearea.innerText = tree_structure;
            treearea.style.marginTop = '0px'; // Reset margin
            temptext.innerText = info;
            operationTimeSpan.innerText = `Time taken for decoding: ${operationTime} ms`;
            
            // Verification message
            compressionRatioSpan.innerText = `Original Encoded Length: ${original_encoded_length} bytes, Decoded Length: ${decoded_length} bytes`;
            if (original_encoded_length !== decoded_length) {
                // This check is very basic and might not catch all edge cases for decoding issues,
                // especially with varied newline characters or corrupted files.
                // A more robust check would involve comparing original input string with decoded result after encoding-decoding cycle.
                compressionRatioSpan.innerText += `\nWarning: Length mismatch after decode! (Possible issue with special characters or newline handling)`;
            }
        };
        fileReader.readAsText(uploadedFile, "UTF-8");
    };

};

// Helper function to trigger file download
function downloadFile(fileName, data){
    let a = document.createElement('a');
    // For handling various character sets and ensuring proper download, consider using Blob
    // let blob = new Blob([data], { type: 'application/octet-stream' });
    // a.href = URL.createObjectURL(blob);
    a.href = "data:application/octet-stream,"+encodeURIComponent(data);
    a.download = fileName;
    a.click();
    // URL.revokeObjectURL(a.href); // Clean up the URL object if using Blob
}