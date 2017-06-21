const uuid = require('uuid');
const mongoose = require('mongoose')

function StorageException(message) {
   this.message = message;
   this.name = "StorageException";
}

const blogPostSchema = mongoose.Schema ({
  title: {type: String, required: true},
  content: {type: String, required: true},
  author: {
    firstName: {type: String, required: true},
    lastName: {type: String, required: true}
  },
  created: {type: Date, required: true}
});

blogPostSchema.virtual('authorString').get(function () {
  return `${this.firstName} ${this.lastName}`
});

blogPostSchema.methods.apiRepr = function() {

  return {
    id: this._id,
    title: this.title,
    content: this.content,
    author: this.authorString,
    created: this.created
  };
}

const BlogPost = mongoose.model('blog-post', blogPostSchema);

module.exports = {BlogPost};