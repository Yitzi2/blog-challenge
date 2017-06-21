const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require('./config')
const {BlogPost} = require('./models');

const jsonParser = bodyParser.json();
const app = express();

//Morgan to log HTTP
app.use(morgan('common'));

app.get('/blog-posts', (req, res) => {
  BlogPost
    .find()
    .exec()
    .then(blogPosts => res.json(
      blogPosts.map(blogPost => blogPost.apiRepr())
    ))
    .catch(
      err => {
        console.error(err);
        res.status(500).json({message: 'Internal server error'});
    });
});

app.get('/blog-posts/:id', (req, res) => {
  BlogPost
    .findById(req.params.id)
    .exec()
    .then(blogPost => res.json(blogPost.apiRepr()))
    .catch(
      err => {
        console.error(err);
        res.status(500).json({message: 'Internal server error'});
    });
});

app.post('/blog-posts', jsonParser, (req, res) => {
  // ensure 'title', 'content' and 'author' are in request body.  publishDate is automatically time of submission.
  const requiredFields = ['title', 'content', 'author', 'author'];
  for (let i=0; i<requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`
      console.error(message);
      return res.status(400).send(message);
    }
  }
  const requiredAuthorFields = ['firstName', 'lastName'];
  for (let i=0; i<requiredAuthorFields.length; i++) {
    const field = requiredAuthorFields[i];
    if (!(field in req.body.author)) {
      const message = `Missing \`${field}\` for author`
      console.error(message);
      return res.status(400).send(message);
    }
  }  
  BlogPost
    .create({
      title: req.body.title,
      content: req.body.content,
      author: {
        firstName: req.body.author.firstName,
        lastName: req.body.author.lastName
      },
      created: Date.now()
    })
    .then(
      blogPost => res.status(201).json(blogPost.apiRepr()))
    .catch(
      err => {
        console.error(err);
        res.status(500).json({message: 'Internal server error'});
    });    
});

//For puts, the author field needs to have 

app.put('/blog-posts/:id', jsonParser, (req, res) => {
    // ensure that the id in the request path and the one in request body match
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message = (
      `Request path id (${req.params.id}) and request body id ` +
      `(${req.body.id}) must match`);
    console.error(message);
    res.status(400).json({message: message});
  }

  const toUpdate = {};
  const updateableFields = ['title', 'content', 'author'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      if (field !== "author") toUpdate[field] = req.body[field];
      else {
        updateableAuthorFields = ['firstName', 'lastName'];
        updateableAuthorFields.forEach(field => {
          if (field in req.body.author) {
            toUpdate["author."+field] = req.body.author[field];
          }
        });
      }
    }
  });

  BlogPost
    .findByIdAndUpdate(req.params.id, {$set: toUpdate}, {new: true})
    .exec()
    .then(blogPost => res.json(blogPost))
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal server error'})
    });
});

// when DELETE request comes in with an id in path,
// try to delete that item from ShoppingList.
app.delete('/blog-posts/:id', (req, res) => {
  BlogPost
    .findByIdAndRemove(req.params.id)
    .exec()
    .then(blogPost => res.status(204).end())
    .catch(err => res.status(500).json({message: 'Internal server error'}));
});

let server;

// this function starts our server and returns a Promise.
// In our test code, we need a way of asynchronously starting
// our server, since we'll be dealing with promises there.
function runServer(databaseURL = DATABASE_URL, port = PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseURL, function (err) {
      if (err) return (reject(err));
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve(server);
      })
      .on('error', err => {
        mongoose.disconnect();
        reject(err)
      });
    })
  });
}

// like `runServer`, this function also needs to return a promise.
// `server.close` does not return a promise on its own, so we manually
// create one.
function closeServer() {
  return new Promise((resolve, reject) => {
    console.log('Closing server');
    server.close(err => {
      if (err) {
        reject(err);
        // so we don't also call `resolve()`
        return;
      }
      resolve();
    });
  });
}

// if server.js is called directly (aka, with `node server.js`), this block
// runs. but we also export the runServer command so other code (for instance, test code) can start the server as needed.
if (require.main === module) {
  runServer().catch(err => console.error(err));
};

module.exports = {app, runServer, closeServer};
