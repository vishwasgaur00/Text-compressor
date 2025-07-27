# Text-compressor

This project focuses on implementing text compression using the Huffman coding algorithm. Huffman coding is a popular lossless compression technique that assigns variable-length codes to characters based on their frequency of occurrence in the text. This approach allows for efficient representation of frequently occurring characters with shorter codes and less frequent characters with longer codes, resulting in overall text compression.

# How Huffman Coding Works
Huffman coding involves the following steps:

1. Frequency Analysis: The text is analyzed to determine the frequency of occurrence for each character.
2. Building the Huffman Tree: A binary tree is constructed using the frequency information, with characters as the tree leaves and the most frequent characters closer to the root.
3. Generating Huffman Codes: The Huffman codes are assigned to each character based on their position in the Huffman tree, with left branches representing '0' and right branches representing '1'.
4. Text Compression: The original text is encoded using the generated Huffman codes, resulting in a compressed representation that occupies fewer bits.
5. Text Decompression: The compressed text is decoded using the Huffman codes and the Huffman tree, reconstructing the original text.
## LIVE DEMO
https://vishwasgaur00.github.io/Text-compressor/
