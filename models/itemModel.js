const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// TODO: create the schema for an Item
let itemSchema = Schema({
	id: {
		type: String,
		required: true,
		minlength: 1,
		maxlength: 4
	},
	name: {
		type: String,
		required: true,
		minlength: 3, //milk, 1 smaller just in case 
        maxlength: 50
	},
	type: {
		type: String,   //id corresponds to id in types collection
        required: true
	},
	img: {
		type: String,
		required: true,
        minlength: 5,
        maxlength: 50
        //validate min/max, also validate ./ && .img
	}
});

const Item = mongoose.model("Item", itemSchema);
module.exports = Item;