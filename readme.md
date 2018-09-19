# THE ASCIIST

## Installation

-   Install Imagemagick first.
-   Run `npm install`.
-   Run `npm link`.

## Command-line use

These tools can be used on the command line. Check it out.

### Running the asciizer

-   Run `asciize --input=path/to/file --output=path/to/file.png`.
-   With `--save_as_image=true` to save it as a .png file instead of as a .txt file.
-   With `--size=<int>` to save adjust the width in characters of the output file. It defaults to 100 characters.
-   With `--invert=true` to invert the grayscaled image.
-   With `--log=<1 or 2>` to change the level of logging.

### Running the degrader

-   Run `degrade --input=path/to/file --output=path/to/file.gif`.
-   With `--incriment=<some number>` to change how quickly the image degrades.
-   With `--max_pixel_size=<some number>` to resize the image before you degrade.
-   With `--min_size=<some number>` to set the width in characters of the last frame.
-   It includes the options of `--size` and `--log` from the asciizer.

## Programmatic use

`const { Asciize, Degradr } = require('asciist');`
