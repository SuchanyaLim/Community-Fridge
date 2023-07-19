// This module is cached as it has already been loaded
const express = require('express');
const fs = require('fs');
const path = require('path');
const { db } = require('./config');
const app = express();
let router = express.Router();

let Type = require("./models/typeModel");
let Fridge = require("./models/fridgeModel");
let Item = require("./models/itemModel");

app.use(express.json()); // body-parser middleware

// Get /fridges and return the all of the fridges based on requested format
router.get('/', (req,res)=> {
    res.format({
		'text/html': ()=> {
			res.set('Content-Type', 'text/html');
			res.sendFile(path.join(__dirname,'public','view_pickup.html'),(err) =>{
				if(err) res.status(500).send('500 Server error');
			});
		},
		'application/json': ()=> {
			Fridge.find(function (err, result) {
				if (err) {
					res.status(500).send('500 Server error');
				}
				else {
					if (result.length == 0) {
						res.status(404).send('Not found');
					}
					else {
						res.status(200);
						res.set('Content-Type', 'application/json');
						res.json(result);	
					}
				}
			});
        },
        'default' : ()=> {
            res.status(406).send('Not acceptable');
        }
    })
});
// helper route, which returns the accepted types currently available in our application. This is used by the addFridge.html page
router.get("/types", function(req, res, next){

  	Type.find(function(err, result) {
		if (err) {
			return res.status(500).send("Database error");
		}
		else {
			if (result.length == 0) {
				return res.status(404).send("Types collection empty");
			}
			else {
				let types = [];
				for (let obj of result) {
					types.push(obj.name);
				}
				res.status(200).set("Content-Type", "application/json").json(types);
			}
		}
	});
});

// Middleware function: this function validates the contents of the request body associated with adding a new fridge into the application
function validateFridgeBody(req,res,next){

	//check if dupe name
	if (req.body.hasOwnProperty("name")) {
		Fridge.findOne({name: req.body.name}, function(err, result) {
			if (err) {
				return res.status(500).send("Database error");
			}
			else {
				if (result != null) {
					return res.status(409).send("Bad request; Fridge already exists");
				}
				//check if accepted types exist in types collection
				if (req.body.hasOwnProperty("acceptedTypes")) {
					Type.find({}, function(err, result) {
						if (err) {
							return res.status(500).send("Database (TYPE) error");
						}
						else {
							if (result.length == 0) {
								return res.status(404).send("No types exist");
							}
							else {
								let types = {};
								for (let obj of result) {
									types[obj.id] = obj.name;
								}
								for (let t of req.body.acceptedTypes) {
									if (types[t] == undefined) {
										return res.status(400).send("Bad request; invalid acceptedTypes");
									}
								}
								next();
							}
						}
					}); 
				}
			}
		});
	}
}
// Middleware function: this validates the contents of request body, verifies item data for adding to fridge
function validateItemBody(req,res,next){
    //check if has properties
	let properties = ['id','quantity'];
    for (property of properties){
        if (!req.body.hasOwnProperty(property))
			return res.status(400).send("Bad request");
    }
	//check if item real
	Item.findOne({id: req.body.id}, function(err, result) {
		if (err) {
			return res.status(500).send("Error finding item");
		}
		else {
			if (result == null) {
				return res.status(400).send("Item " + req.body.id + " does not exist");
			}
			else {
				next();
			}	
		}
	});
    
}
// Adds a new fridge, returns newly created fridge
router.post('/', validateFridgeBody, (req,res)=> {

	Fridge.count({}, function(err, result) {		//count for id
		if (err) {
			return res.status(500).send("Database error");
		}
		else {
			let newBody = req.body;
			newBody.address["country"] = "Canada";
			let newId = result+1;
			let newFridge = Fridge({id: "fg-"+newId, ...newBody, items:[]});
			newFridge.save(function(err, result){
				if (err) {
					return res.status(400).send(err.message);		//at this point fridge database definitely exists, errors likely 400 only
				}
				else {
					return res.status(200).set("Content-Type", "application/json").json(result);
				}
			});
		}
	});
});

// Get /fridges/{fridgeID}. Returns the data associated with the requested fridge.
router.get("/:fridgeId", function(req, res, next){

	Fridge.findOne({id: req.params.fridgeId}, function(err, result) {
		if (err) {
			return res.status(500).send("Database error");
		}
		else {
			if (result == null) {
				return res.status(404).send("Not Found");
			}
			else {
				res.status(200);
				res.set('Content-Type', 'application/json');
				res.json(result);	
			}
		}
	});
});

// Updates a fridge and returns the data associated.
// Should probably also validate the item data if any is sent, oh well :)
router.put("/:fridgeId", (req, res) =>{

	Fridge.findOne({id: req.params.fridgeId}, function(err, result) {
		if (err) {
			return res.status(500).send("Database error");
		}
		else {
			if (result == null) {
				return res.status(404).send("Fridge to update not found");
			}
			else {
				for (let [key, attr] of Object.entries(req.body)) {
					if (key == "address") {
						for (let [keyOf, attrOf] of Object.entries(attr)) {
							result.address[keyOf] = attrOf;
						}
					}
					else if (key == "contactInfo") {
						for (let [keyOf, attrOf] of Object.entries(attr)) {
							result.contactInfo[keyOf] = attrOf;
						}
					}
					else {
						result[key] = attr;
					}
				}
				result.save(function(err, UpdatedResult) {
					if (err) {
						return res.status(400).send(err.message);
					}
					else {
						res.status(200).send(UpdatedResult);
					}
				});
			}
		}
	});
});

// Adds an item to specified fridge
router.post("/:fridgeId/items", validateItemBody, (req,res)=>{

	//find fridge
	Fridge.findOne({id: req.params.fridgeId}, function(err, result) {
		if (err) {
			return res.status(500).send("Database error");
		}
		else {
			if (result == null) {
				return res.status(404).send("Fridge not found");
			}
			else {
				for (let item of result.items) {
					if (item.id == req.body.id) {
						return res.status(409).send("Duplicate Item");
					}
				}
				result.items.push(req.body);
				result.numItemsAccepted += req.body.quantity;
				result.save(function(err, resultUpdate) {
					if (err) {
						return res.status(400).send(err.message);
					}
					else {
						return res.status(200).send(resultUpdate);
					}
				});
			}
		}
	});
});

// Deletes an item from specified fridge
router.delete("/:fridgeId/items/:itemId", (req,res)=>{
	
	let fridgeID = req.params.fridgeId;
	let itemID = req.params.itemId;

	Fridge.findOne({id: fridgeID}, function(err, result) {
		if (err) {
			return res.status(500).send("Database error");
		}
		else {
			if (result == null) {
				return res.status(404).send("Could not find fridge");
			}
			else {
				let itemIndex = undefined;	//an index not in the fridge
				let count = 0;
				for (let item of result.items) {
					if (item.id == itemID) {
						itemIndex = count;
						break;
					}
					count++;
				}
				if (itemIndex == undefined) {
					return res.status(404).send("Item not in fridge");
				}
				result.items.splice(itemIndex, 1);
				result.save(function(err, result) {
					if (err) {
						return res.status(500).send("Update error");
					}
					else {
						res.status(200).send("Delete success");
					}
				});
			}
		}
	});
});

router.delete("/:fridgeId/items", (req,res)=>{
	
	let idsToRemove = req.query.item;
	let fridgeID = req.params.fridgeId;
	Fridge.findOne({id: fridgeID}, function(err, result) {
		if (err) {
			return res.status(500).send("Database error");
		}
		else {
			if (result == null) { 
				return res.status(404).send('Fridge Id does not exist');
			}
			else {
				let updatedItems = result.items;
				//found fridge, now delete the items
				if (idsToRemove == undefined) {
					updatedItems = [];
				}
				else {
					let indexToRemove = -1;	//index of item in arr
					let count = 0;		//index of current item
					for (let itemId of idsToRemove) {
						console.log(updatedItems);	
						for (let item of updatedItems) {
							if (item.id == itemId) {
								indexToRemove = count;
								break;
							}
							count++;
						}
						if (indexToRemove < 0) {
							return res.status(404).send('One or more of the item Ids does not exist');
						}
						updatedItems.splice(indexToRemove, 1);
						indexToRemove = -1;
						count = 0;
					}
				}
				result.items = updatedItems;
				result.save(function(err, result) {
					if (err) {
						return res.status(500).send("Database error");
					}
					else {
						return res.status(200).send("Delete success");
					}
				});
			}
		}
	});
});

//adds a quantity to the fridge
router.put("/:fridgeId/items/:itemId", (req, res) =>{
	Fridge.findOne({id: req.params.fridgeId}, function(err, result) {
		if (err) {
			return res.status(500).send("Database error");
		}
		else {
			if (result == null) {
				return res.status(404).send("Fridge to update not found");
			}
			else {
				let updated = false;
				for (let item of result.items) {
					if (item.id == req.params.itemId) {
						item.quantity += req.body.quantity;
						updated = true;
						break;
					}
				}
				if (updated == false) { 
					return res.status(404).send("Item does not exist in fridge");
				}
				else {
					result.numItemsAccepted += req.body.quantity;
					result.save(function(err, result) {
						if (err) {
							return res.status(500).send("Database error");
						}
						else {
							return res.status(200).send(result);
						}
					});
				}
			}
		}
	});
});


module.exports = router;
