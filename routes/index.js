var express = require('express');
var router = express.Router();
var fs = require('fs');

var DOCS_PER_VIEW = 10;

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', { title: 'Lexnorm Labeller' });
});

router.post('/submit_dataset', function(req, res, next) {

	if(req.body.rejectedDataset === undefined) {
		req.body.rejectedDataset = [];
	}
	if(req.body.dataset === undefined) {
		req.body.dataset = [];
	}

	var dataset = JSON.stringify(req.body.dataset);	
	var rejectedDataset = JSON.stringify(req.body.rejectedDataset || {}) ;
	var outputFilename = req.body.outputFilename;	
	var rejectedFilename = req.body.rejectedFilename;


	var replacementDictionary = req.body.replacementDictionary;

	var trimmedOutputFilename = outputFilename.match(/\d+_to_\d+/g)[0];

	fs.writeFileSync('data/replacement_dictionary/replacement_dictionary.json', JSON.stringify(replacementDictionary, null, 4));
	fs.writeFileSync('data/replacement_dictionary/replacement_dictionary_' + trimmedOutputFilename + ".json", JSON.stringify(replacementDictionary, null, 4));


	outputFilename = outputFilename.slice(0, outputFilename.indexOf(".json")) + "_" + req.body.dataset.length + ".json";
	rejectedFilename = rejectedFilename.slice(0, rejectedFilename.indexOf(".json")) + "_" + req.body.rejectedDataset.length + ".json";

	fs.writeFileSync(outputFilename, dataset);
	fs.writeFileSync(rejectedFilename, rejectedDataset);

	// TODO: Check if that was the last subset of the dataset and create 
	// a new output folder if it was.

	res.send({"success": true})

});

router.get('/get_dataset', function(req, res, next) {
	
	function getCurrentDataset() {

		function datasetSort(a, b) {
			anum = parseInt(a.match(/_\d+/g)[0].replace(/_/g, ''));
			bnum = parseInt(b.match(/_\d+/g)[0].replace(/_/g, ''));
			return anum - bnum;
		}

		function outputDatasetSort(a, b) {
			anum = parseInt(a.match(/\d+_/g)[0].replace(/_/g, ''));
			bnum = parseInt(b.match(/\d+_/g)[0].replace(/_/g, ''));
			return anum - bnum;
		}

		// Read the input datasets and create a sorted list of them (minus the _5170.json part).
		inputDatasets = fs.readdirSync('data/intermediate_data');
		inputDatasets.splice(inputDatasets.indexOf(".gitignore"), 1);
		inputDatasetShortnames = [];
		for(var i in inputDatasets) {
			inputDatasetShortnames[i] = inputDatasets[i].replace(/_\d+.json/, '');
		}
		inputDatasetShortnames.sort(datasetSort);

		// Read the list of folders that have been created to store the outputs so far.
		outputDatasetFolders = fs.readdirSync('data/output_data');
		outputDatasetFolders.splice(outputDatasetFolders.indexOf(".gitignore"), 1).sort(datasetSort).reverse();

		// Determine the latest folder.
		if(outputDatasetFolders.length == 0) {
			latestFolder = inputDatasetShortnames[0];
			fs.mkdirSync('data/output_data/' + latestFolder) // TODO: Create new empty folder when done with dataset
			fs.mkdirSync('data/output_data/' + latestFolder + '/rejected_documents')
		} else {
			latestFolder = outputDatasetFolders[0];
		}
		
		// Determine the index to start from by looking in the latest folder and finding the latest output dataset.
		outputDatasetFiles = fs.readdirSync('data/output_data/' + latestFolder);
		outputDatasetFiles.pop("rejected_documents");
		if(outputDatasetFiles.length == 0) {
			latestIndex = 0;
		} else {
			outputDatasetFiles.sort(outputDatasetSort).reverse();
			outputDatasetFiles[0] = outputDatasetFiles[0].replace(/_\d+\.json/g, '.json');
			latestIndex = parseInt(outputDatasetFiles[0].match(/_\d+\.json/g)[0].replace(/_/g, '').replace(/\.json/g, ''));			
		}


		// Open the input folder corresponding to latestFolder.
		relevantInputDataset = null;
		for(var i in inputDatasets) {
			if(inputDatasets[i].indexOf(latestFolder + "_") != -1) {
				relevantInputDataset = inputDatasets[i];
			}
		}
		loadedDataset = JSON.parse(fs.readFileSync('data/intermediate_data/' + relevantInputDataset));

		slicedDataset = loadedDataset.slice(latestIndex, latestIndex + DOCS_PER_VIEW);

		for(var i = 0; i < slicedDataset.length; i++) {
			slicedDataset[i]["idx"] = latestIndex + i + 1;
		}

		outputFilename = "data/output_data/" + latestFolder + "/" + (latestIndex + 1) + "_to_" + (latestIndex + DOCS_PER_VIEW) + ".json";
		rejectedFilename = "data/output_data/" + latestFolder + "/rejected_documents/" + (latestIndex + 1) + "_to_" + (latestIndex + DOCS_PER_VIEW) + ".json";


		replacementDictionary = {};
		return [slicedDataset, relevantInputDataset, latestIndex / DOCS_PER_VIEW, Math.ceil(loadedDataset.length / DOCS_PER_VIEW), outputFilename, rejectedFilename, replacementDictionary ];
	}

	function getDatasetStartIndex() {

	}

	function getReplacementDictionary() {
		try { return JSON.parse(fs.readFileSync('data/replacement_dictionary/replacement_dictionary.json', 'utf-8')); }
		catch(err) { console.log(err) }
	}

	try { var data = getCurrentDataset() }
	catch(err) { console.log(err) }

	//var data = JSON.parse(fs.readFileSync('data/intermediate_data/data_1_5720.json', 'utf8'));

	res.send({ data: data[0], datasetName: data[1], latestIndex: data[2], datasetLength: data[3], outputFilename: data[4], rejectedFilename: data[5] , replacementDictionary: getReplacementDictionary() })
});



module.exports = router;
