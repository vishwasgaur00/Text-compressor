import { BinaryHeap } from './heap.js';

export { HuffmanCoder }

class HuffmanCoder{

    // Converts the Huffman tree node structure into a string for storage/transmission.
    // Handles leaf nodes (characters) differently from internal nodes (arrays of children).
    stringify(node){
        if(typeof(node[1])==="string"){ // If it's a leaf node (contains a character)
            return '\''+node[1]; // Prefix with ' to indicate it's a character
        }

        // Recursive call for internal nodes: '0' + stringify left child + '1' + stringify right child
        return '0' + this.stringify(node[1][0]) + '1' + this.stringify(node[1][1]);
    }

    // Displays the Huffman tree structure in a human-readable format.
    // 'modify' parameter is used when displaying the decoded tree, which has a slightly different initial structure.
    display(node, modify, index=1){
        if(modify){
            // Adjust the node structure for display if it's from the decoded tree
            node = ['',node]; // Convert to a [freq, [left, right]] format
            if(node[1].length===1) // If it's a simplified root from decode (e.g., [['char']])
                node[1] = node[1][0]; // Extract the actual root node
        }

        if(typeof(node[1])==="string"){ // If it's a leaf node
            return String(index) + " = " + node[1]; // Display its index and character
        }

        // Recursively display left and right children
        let left = this.display(node[1][0], modify, index*2);
        let right = this.display(node[1][1], modify, index*2+1);
        // Display parent-child relationships
        let res = String(index*2)+" <= "+index+" => "+String(index*2+1);
        return res + '\n' + left + '\n' + right;
    }

    // Reconstructs the Huffman tree structure from its stringified representation.
    // 'this.ind' is used as a global index to track position in the stringified data.
    destringify(data){
        let node = [];
        if(data[this.ind]==='\''){ // If current char is start of a character literal
            this.ind++; // Move past '\''
            node.push(data[this.ind]); // Add the character
            this.ind++; // Move past the character
            return node;
        }

        this.ind++; // Consume '0' for left child
        let left = this.destringify(data); // Recursively build left subtree
        node.push(left); // Add left child

        this.ind++; // Consume '1' for right child
        let right = this.destringify(data); // Recursively build right subtree
        node.push(right); // Add right child

        return node;
    }

    // Recursively traverses the Huffman tree to generate binary code mappings for each character.
    // 'path' accumulates the '0's and '1's from the root to the current node.
    getMappings(node, path){
        if(typeof(node[1])==="string"){ // If it's a leaf node (character)
            this.mappings[node[1]] = path; // Store the character and its binary path
            return;
        }

        this.getMappings(node[1][0], path+"0"); // Traverse left, append '0' to path
        this.getMappings(node[1][1], path+"1"); // Traverse right, append '1' to path
    }

    // Encodes the input 'data' string using Huffman coding.
    encode(data){

        this.heap = new BinaryHeap(); // Initialize a new binary heap

        const mp = new Map(); // Use Map to store character frequencies
        for(let i=0; i<data.length; i++){
            const char = data[i];
            mp.set(char, (mp.get(char) || 0) + 1); // Increment frequency for each character
        }

        // Insert characters and their negative frequencies into the heap.
        // Negative frequencies are used because BinaryHeap is a Max-Heap,
        // and we want nodes with lower actual frequencies to be extracted first.
        for(const [key, value] of mp){
            this.heap.insert([-value, key]); // Key: -frequency, Value: character
        }

        // Build the Huffman tree by repeatedly combining the two lowest frequency nodes
        while(this.heap.size() > 1){
            const node1 = this.heap.extractMax(); // Extract node with lowest actual frequency
            const node2 = this.heap.extractMax(); // Extract second node with lowest actual frequency

            // Create a new internal node: sum of frequencies, and children are the extracted nodes
            const node = [node1[0]+node2[0], [node1, node2]]; // Sum of negative frequencies
            this.heap.insert(node); // Insert the new internal node back into the heap
        }
        const huffman_encoder = this.heap.extractMax(); // The last remaining node is the root of the Huffman tree

        this.mappings = {}; // Initialize an object to store character to binary code mappings
        this.getMappings(huffman_encoder, ""); // Populate the mappings by traversing the tree

        let binary_string = ""; // The raw binary string representation of the encoded data
        for(let i=0; i<data.length; i++) {
            binary_string += this.mappings[data[i]]; // Append the binary code for each character in the input data
        }

        // Calculate padding needed to make the binary_string a multiple of 8 bits (for byte conversion)
        let rem = (8 - binary_string.length % 8) % 8;
        let padding = "";
        for(let i=0; i<rem; i++)
            padding += "0";
        binary_string += padding; // Add padding of '0's to the end

        let result_bytes = ""; // Stores the compressed data as a string of characters (each char represents a byte)
        for(let i=0; i<binary_string.length; i+=8){
            let num = 0;
            // Convert each 8-bit segment of the binary string to its decimal equivalent
            for(let j=0; j<8; j++){
                num = num * 2 + (binary_string[i+j] - "0"); // Convert char '0' or '1' to number 0 or 1
            }
            result_bytes += String.fromCharCode(num); // Convert the decimal to a character and append
        }

        // Final compressed output format: stringified_tree \n padding_length \n compressed_bytes_string
        let final_res = this.stringify(huffman_encoder) + '\n' + rem + '\n' + result_bytes;

        let info = "Compression complete and file sent for download.";
        // Returns the compressed data string, the tree structure for display,
        // original data length, final compressed data string length, and info message.
        return [final_res, this.display(huffman_encoder, false), data.length, final_res.length, info];
    }

    // Decodes the compressed 'data' string back to its original form.
    decode(data){
        // The input 'data' is a string that was created by the 'encode' method,
        // formatted as: stringified_tree \n padding_length \n compressed_bytes_string
        data = data.split('\n'); // Split by newlines to get parts

        // --- Robustly Reconstruct Tree String, Padding, and Encoded Bytes String ---
        // This handles cases where the original text might have contained newlines,
        // causing data.split('\n') to incorrectly segment the tree string.
        let huffman_tree_str_parts = [];
        let rem_str = '';
        let encoded_bytes_str = '';
        let found_rem = false;

        for (let i = 0; i < data.length; i++) {
            const line = data[i];
            if (!found_rem && !isNaN(parseInt(line.trim())) && (line.trim().length === 1 || line.trim().length === 0)) {
                // This line is likely the 'rem' (padding length). It should be a single digit or empty string if 0 padding.
                rem_str = line.trim();
                found_rem = true;
                // All subsequent lines are part of the encoded_bytes_str
                for (let j = i + 1; j < data.length; j++) {
                    encoded_bytes_str += data[j];
                    if (j < data.length - 1) { // Add newline back if it was part of the original content
                        encoded_bytes_str += '\n';
                    }
                }
                break; // Stop processing lines for tree_string_parts
            }
            huffman_tree_str_parts.push(line);
        }

        const huffman_tree_str = huffman_tree_str_parts.join('\n'); // Reconstruct the full tree string
        const rem = parseInt(rem_str) || 0; // Parse padding length, default to 0 if empty/invalid

        // --- Tree Reconstruction ---
        this.ind = 0; // Reset index for destringify
        const huffman_decoder = this.destringify(huffman_tree_str); // Reconstruct the Huffman tree from its stringified form
        
        // --- Convert Encoded Bytes String Back to Binary String ---
        let binary_string = "";
        for(let i=0; i<encoded_bytes_str.length; i++){
            let num = encoded_bytes_str[i].charCodeAt(0); // Get ASCII/Unicode value of character
            let bin = "";
            // Convert each character's decimal value back to an 8-bit binary string
            for(let j=0; j<8; j++){
                bin = (num % 2) + bin; // Build binary string from right to left (least significant bit first)
                num = Math.floor(num / 2);
            }
            binary_string += bin; // Append the 8-bit binary string
        }

        // --- Remove Padding ---
        binary_string = binary_string.substring(0, binary_string.length - rem); // Remove the '0's that were added for padding

        // --- Traverse Tree with Binary String to Decode Text ---
        let res = ""; // Resulting decoded text
        let node = huffman_decoder; // Start at the root of the Huffman tree
        for(let i=0; i<binary_string.length; i++){
            if(binary_string[i]==='0'){
                node = node[0]; // Traverse left if '0'
            } else{
                node = node[1]; // Traverse right if '1'
            }

            // If a leaf node is reached (meaning it contains a character string)
            if(typeof(node[0])==="string"){
                res += node[0]; // Append the decoded character to the result
                node = huffman_decoder; // Reset to the root to decode the next character
            }
        }
        let info = "Decompression complete and file sent for download";
        // Returns the decoded text, the tree structure (adjusted for display),
        // the length of the *original encoded bytes string*, the length of the *decoded text*, and info message.
        return [res, this.display(huffman_decoder, true), encoded_bytes_str.length, res.length, info];
    }
}