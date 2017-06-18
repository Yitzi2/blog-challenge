const chai = require('chai');
const chaiHttp = require('chai-http');
const {app, runServer, closeServer} = require('../server');

const should = chai.should();

chai.use(chaiHttp);

describe ('blog', function () {
	before (function () {return runServer();});
	after (function () {return closeServer();});
	it ('should list items on GET containing title, author, id, content, and publishDate', function () {
		return chai.request(app)
			.get('/blog-posts')
			.then(function (res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.an('array');
				res.body.length.should.be.at.least(1);
				res.body.forEach(function(item) {
					item.should.be.an('object').that.has.all.keys('title', 'author', 'id', 'content', 'publishDate');
				});
			});
	});
	it ('should add such an item on POST', function () {
		const newItem = {title: "Test post", content: "This is only a test", author: "tester script"};
		return chai.request(app)
			.post('/blog-posts')
			.send(newItem)
			.then(function (res) {
				res.should.have.status(201);
				res.should.be.json;
				res.body.id.should.not.be.null;
				res.body.should.deep.equal(Object.assign(newItem, {id: res.body.id, publishDate: res.body.publishDate}));
			});
	});
	it ('should update item on PUT', function () {
		const updateData = {title: "Test post 2", content: "This is only a test", author: "tester script"};
		return chai.request(app)
			.get('/blog-posts')
			.send(updateData)
			.then(function(res) {
				updateData.id = res.body[0].id;
			})
		return chai.request(app)
			.put(`/blog-posts/${updateData.id}`)
			.then(function (res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.id.should.be.an('object');
				res.body.should.deep.equal(Object.assign(updateData, {publishDate: res.body.publishDate}));
			});
	});
	it ('should delete item on PUT', function () {
		return chai.request(app)
			.get('/blog-posts')
			.then(function(res) {
				return chai.request(app)
					.delete(`/blog-posts/${res.body[0].id}`);
			})
				.then(function (res) {
				res.should.have.status(204);
			});
	});
});