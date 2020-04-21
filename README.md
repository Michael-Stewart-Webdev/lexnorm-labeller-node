## Lexnorm Labeller

Lexnorm Labeller is a lightweight annotation interface for labelling data for lexical normalisation.

### Running the code

First, place your dataset into `data/input_data/input_data.txt`. Open `dsts.txt` and replace the list with a list of the known domain-specific terms in your dataset, i.e. the terms that don't require normalisation.

Then run the script in `data/txt_to_json.py`:

    python txt_to_json.py

Install npm dependencies:

    npm install

Start the server:

    npm start

### Using the interface

The interface will present 10 documents at a time. Some words will be highlighted in red - these are the words that are non-English and not appearing in your DSTs list. Click on any word to type in the correct form of that word. A yellow "Add to dictionary" button will pop up after making a correction. Clicking the button will cause all subsequent mentions of that word to be automatically replaced with the correction you just made. 

### Output

The replacement dictionary is saved to `data/replacement_dictionary/replacement_dictionary.json`.

The output annotations are saved to `data\output_data\data_1`.

### Other notes

It's possible to split your dataset up into separate chunks (helpful if you have a huge dataset), but it's been a long time since I've tested the feature so it may not work correctly. To do this, set `NUM_SPLITS` in `data/txt_to_json.py` to a number greater than 1.