var express = require('express');
var router = express.Router();
var fs = require('fs');

var DOCS_PER_VIEW = 20;

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', { title: 'Lexnorm Labeller' });
});

router.post('/submit_dataset', function(req, res, next) {
	var dataset = JSON.stringify(req.body.dataset);
	var outputFilename = req.body.outputFilename;

	fs.writeFileSync(outputFilename, dataset);

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
		inputDatasets = fs.readdirSync('data/input_data');
		inputDatasetShortnames = [];
		for(var i in inputDatasets) {
			inputDatasetShortnames[i] = inputDatasets[i].replace(/_\d+.json/, '');
		}
		inputDatasetShortnames.sort(datasetSort);

		// Read the list of folders that have been created to store the outputs so far.
		outputDatasetFolders = fs.readdirSync('data/output_data');
		outputDatasetFolders.sort(datasetSort).reverse();

		console.log(outputDatasetFolders.length)
		// Determine the latest folder.
		if(outputDatasetFolders.length == 0) {
			latestFolder = inputDatasetShortnames[0];
			fs.mkdirSync('data/output_data/' + latestFolder) // TODO: Create new empty folder when done with dataset
		} else {
			latestFolder = outputDatasetFolders[0];
		}
		
		// Determine the index to start from by looking in the latest folder and finding the latest output dataset.
		outputDatasetFiles = fs.readdirSync('data/output_data/' + latestFolder);
		if(outputDatasetFiles.length == 0) {
			latestIndex = 0;
		} else {
			outputDatasetFiles.sort(outputDatasetSort).reverse();
			latestIndex = parseInt(outputDatasetFiles[0].match(/_\d+\.json/g)[0].replace(/_/g, '').replace(/\.json/g, ''));			
		}


		// Open the input folder corresponding to latestFolder.
		relevantInputDataset = null;
		for(var i in inputDatasets) {
			if(inputDatasets[i].indexOf(latestFolder + "_") != -1) {
				relevantInputDataset = inputDatasets[i];
			}
		}
		loadedDataset = JSON.parse(fs.readFileSync('data/input_data/' + relevantInputDataset));

		slicedDataset = loadedDataset.slice(latestIndex, latestIndex + DOCS_PER_VIEW);

		for(var i = 0; i < slicedDataset.length; i++) {
			slicedDataset[i]["idx"] = latestIndex + i + 1;
		}

		outputFilename = "data/output_data/" + latestFolder + "/" + (latestIndex + 1) + "_to_" + (latestIndex + DOCS_PER_VIEW) + ".json";

		return [slicedDataset, latestIndex / DOCS_PER_VIEW, loadedDataset.length / DOCS_PER_VIEW, outputFilename ];
	}

	function getDatasetStartIndex() {

	}

	try {
		var data = getCurrentDataset()
	} catch(err) { console.log(err) }

	//var data = JSON.parse(fs.readFileSync('data/input_data/data_1_5720.json', 'utf8'));

	res.send({ data: data[0], latestIndex: data[1], datasetLength: data[2], outputFilename: data[3] })
});



module.exports = router;
