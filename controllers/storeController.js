const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if(isPhoto) next(null, true);
    else next({ message: 'That filetype not allowed!'}, false);
  }
}

exports.homePage = (req, res) => {
  res.render('index');
  req.flash('error ')
};

exports.addStore = (req, res) => {
  res.render('editStore', {
    title: 'Add Store'
  });
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  if(!req.file) {
    next(); 
    return;
  }
  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`); 
  next();
};

exports.createStore = async (req, res) => {
  const store = await (new Store(req.body)).save();
  req.flash('success', `Successfully created ${store.name}. Care to leave a review?`);
  res.redirect('/');
}

exports.getStores = async (req, res) => {
  // query db for all stores
  const stores = await Store.find();
  res.render('stores', { title: 'Stores', stores });
}

exports.editStore = async (req, res) => {
  // 1. Find the store given the id
  const store = await Store.findOne({ _id: req.params.id });
  // 2. Confirm they are the owner of the store
  // 3. Render out the edit form so the user can update their store
  res.render('editStore', { title: `Edit ${store.name}`, store });
}

exports.updateStore = async (req, res) => {
  // find and update the store
  // redirect to store
  const store = await Store.findOneAndUpdate({ _id: req.params.id}, req.body, {
    new: true, // new store instead of the old one
    runValidators: true
  }).exec();
  req.flash('success', `Successfully Updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store -></a>`)
  res.redirect(`/stores/${store._id}/edit`);
}

exports.getStorebySlug = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug });
  if(!store) return next();
  res.render('store', { store, title: store.name });
};