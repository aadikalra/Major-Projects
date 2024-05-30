const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const categorySchema = new Schema({
    name: String,
    image: {
        type: Object,
    },
});

const Category = mongoose.model("Category", categorySchema);
module.exports = Category;