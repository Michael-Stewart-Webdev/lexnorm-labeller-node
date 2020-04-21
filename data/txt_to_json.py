import codecs, json
from colorama import Fore, Back, Style
import numpy as np

DATA_FILE = "input_data/input_data.txt"
NUM_SPLITS = 1 # Number of times the data is split up

json_data = []

replacement_dictionary = {
	"ee": "employee",
}

replacement_dictionary_inverted = { v: k for k,v in replacement_dictionary.items()}

# Get the set of DSTs from the DMP AU data
with open("input_data/dsts.txt", "r") as f:
	dsts = f.read().splitlines() 
dsts = set(dsts)

# Get the set of valid words
with codecs.open("input_data/words_en.txt", "r", 'utf-8') as f:
	lines = f.read().splitlines() 
word_set = set(lines)


def word2tag(word):
	if not any(c.isalpha() for c in word):
		return word
	elif word in dsts or word in word_set:
		return word 
	elif word in replacement_dictionary:
		return replacement_dictionary[word]
	else:
		return ""

with codecs.open(DATA_FILE, "r", "utf-8") as f:
	for i, line in enumerate(f):
		line = line.strip()

		input_line = [word for word in line.split()]
		output_line = [word2tag(word) for word in input_line]
		json_line = { "index": i, "input": input_line, "output": output_line }
		json_data.append(json_line)
		if i % 1000 == 0:
			print("\r%s" % i, end="")

def tag2color(tag):
	if len(tag) == 0:
		return Fore.RED + "unknown" + Style.RESET_ALL
	elif tag in replacement_dictionary_inverted:
		return Fore.CYAN + tag + Style.RESET_ALL
	elif tag in dsts:
		return Fore.GREEN + tag + Style.RESET_ALL
	else:
		return tag

for line in json_data[:100]:
	print(" ".join(line["input"]))
	print(" ".join([ tag2color(tag) for tag in line["output"]]))
	print("")

split_datasets = np.array_split(json_data, NUM_SPLITS)

for i, s in enumerate(split_datasets):
	with codecs.open("intermediate_data/data_%d_%d.json" % (i + 1, len(s)), "w", "utf-8") as f:
		json.dump(s.tolist(), f)	

with codecs.open("intermediate_data/data_combined.json", "w", "utf-8") as f:
	json.dump(json_data, f)