const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// TODO: create the schema for a Fridge
let fridgeSchema = Schema({
	id: {
		type: String,
		required: true,
		minlength: 4,
		maxlength: 6
	},
	name: {
		type: String,
		required: true,
		minlength: 6, //Fridge == 6 char 
        maxlength: 50
	},
	numItemsAccepted: {
		type: Number,
		default: 0,
        min: 0
	},
	canAcceptItems: {
		type: Number,
		required: true,
        min: 1,
        max: 100
	},
	contactInfo: {
        type: {
			contactPerson: {
                type: String,
                required: true
            },
            contactPhone: {
                type: String,
                required: true
            }
		}
    },
	address: {
        type: {
            street: {
                type: String,
                required: true
            },
            postalCode: {
                type: String,
                required: true
            },
            city: {
                type: String,
                required: true
            },
            province: {
                type: String,
                required: true
            },
            country: {
                type: String,
                required: true
            }
        },
        required: true
    },
    acceptedTypes: {
        type: [String],     //should be ARR of str
        required: true
    },
    items: [{
            id: {type: String}, //corresponds to the id in items collection
            quantity: {type: Number}
    }]
});

const Fridge = mongoose.model("Fridge", fridgeSchema);
module.exports = Fridge;


//are we allowed to have any methods here?