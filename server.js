const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const {BlogPosts} = require('./models');

const jsonParser = bodyParser.json();
const app = express();

//Morgan to log HTTP
app.use(morgan('common'));

BlogPosts.create('First post', 'Hi, this is my blog', 'me', '1/1/2000');
BlogPosts.create('Second post', 'Coming up with posts is the hardest part of this project', 'me', '1/2/2000');
BlogPosts.create('Last post', 'So this is the last one', 'me', '1/3/2000');

app.get('/blog-posts', (req, res) => {
  res.status(200).json(BlogPosts.get());
});

app.post('/blog-posts', jsonParser, (req, res) => {
  // ensure 'title', 'content' and 'author' are in request body.  publishDate is automatically time of submission.
  const requiredFields = ['title', 'content', 'author'];
  for (let i=0; i<requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`
      console.error(message);
      return res.status(400).send(message);
    }
  }

  const post = BlogPosts.create(req.body.title, req.body.content, req.body.author);
  res.status(201).json(post);
});

app.put('/blog-posts/:id', jsonParser, (req, res) => {
  const requiredFields = ['title', 'content', 'author'];
  for (let i=0; i<requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`
      console.error(message);
      return res.status(400).send(message);
    }
  }
  console.log(`Updating post \`${req.params.id}\``);
  try {
  	BlogPosts.update({
    	id: req.params.id,
    	title: req.body.title,
    	content: req.body.content,
    	author: req.body.author
  	}); //PublishDate cannot be overwritten on update.
  	res.status(204).end();
  }
  catch (exception) {
  	if (exception.name !== "StorageException") throw exception;
  	const {message} = exception;
    console.error(message);
    return res.status(400).send(message);  
  }
});

// when DELETE request comes in with an id in path,
// try to delete that item from ShoppingList.
app.delete('/blog-posts/:id', (req, res) => {
  BlogPosts.delete(req.params.id);
  console.log(`Deleted post \`${req.params.ID}\``);
  res.status(204).end();
});

let server;

// this function starts our server and returns a Promise.
// In our test code, we need a way of asynchronously starting
// our server, since we'll be dealing with promises there.
function runServer() {
  const port = process.env.PORT || 8080;
  return new Promise((resolve, reject) => {
    server = app.listen(port, () => {
      console.log(`Your app is listening on port ${port}`);
      resolve(server);
    }).on('error', err => {
      reject(err)
    });
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
