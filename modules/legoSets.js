/********************************************************************************
*  WEB322 – Assignment 05
* 
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
* 
*  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
* 
*  Name: Ayush Dobiwala
*  Student ID: 152879227      
*  Date: 17th July, 2024
*
*  Published URL: lego-collection-ashy.vercel.app
*
********************************************************************************/

require('dotenv').config();
const Sequelize = require('sequelize');

// set up sequelize to point to our postgres database
const sequelize = new Sequelize('SenecaDB', 'SenecaDB_owner', 'gDqZHo9lWNe3', {
  host: 'ep-weathered-glade-a5b46x0z.us-east-2.aws.neon.tech',
  dialect: 'postgres',
  port: 5432,
  dialectOptions: {
    ssl: { rejectUnauthorized: false },
  },
});

const Theme = sequelize.define('Theme', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  name: Sequelize.STRING
});

const Set = sequelize.define('Set', {
  set_num: { type: Sequelize.STRING, primaryKey: true },
  name: Sequelize.STRING,
  year: Sequelize.INTEGER,
  num_parts: Sequelize.INTEGER,
  theme_id: Sequelize.INTEGER,
  img_url: Sequelize.STRING
});

Set.belongsTo(Theme, { foreignKey: 'theme_id' });

function initialize() {
  return new Promise(async (resolve, reject) => {
    try {
      await sequelize.sync();
      resolve();
    }catch(err){
      reject(err.message);
    }
  });
}

// get all sets in DB
function getAllSets() {
  return new Promise((resolve, reject) => {
    Set.findAll({
      include: [Theme],
    }).then((sets) => {
      resolve(sets);
    }).catch((err) => {
      reject(err.message);
    });
  });
}

// get single set with set_num matching param
function getSetByNum(setNum) {
  return new Promise((resolve, reject) => {
    Set.findAll({
      where: {set_num: setNum},
      include: [Theme]
    }).then((set) => {
      resolve(set[0]); // returns just the set found
    }).catch((err) => {
      reject("unable to find requested set");
    });
  });
}

// get all sets with theme matching param
function getSetsByTheme(theme) {
  return new Promise((resolve, reject) => {
    Set.findAll({
      include: [Theme],
      where: {
        '$Theme.name$': { [Sequelize.Op.iLike]: `%${theme}%` }
      }
    })
      .then((sets) => {
        resolve(sets); // Return an array of sets matching the theme
      })
      .catch((err) => {
        reject("Unable to find requested sets");
      });
  });
}

// add a new set with data = setData
function addSet(setData) {
  return new Promise((resolve, reject) => {
    Set.create({
      set_num: setData.set_num,
      name: setData.name,
      year: setData.year,
      num_parts: setData.num_parts,
      theme_id: setData.theme_id,
      img_url: setData.img_url,
    }).then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err.errors[0].message);
      });
  });
}

// return list of all themes
function getAllThemes() {
  return new Promise((resolve, reject) => {
    Theme.findAll({})
      .then((themes) => {
        resolve(themes);
      })
      .catch((err) => {
        reject(err.message);
      })
  })
}
// update set with set_num matching setNum with data = setData
function editSet(setNum, setData) {
  return new Promise((resolve, reject) => {
    Set.update({
      name: setData.name,
      year: setData.year,
      num_parts: setData.num_parts,
      theme_id: setData.theme_id,
      img_url: setData.img_url,
    }, {
      where: { set_num: setNum }
    }).then(() => {
      resolve();
    }).catch((err) => {
      reject(err.errors[0].message);
    });
  });
}

// delete set with set_num matching setNum
function deleteSet(setNum) {
  return new Promise((resolve, reject) => {
    Set.destroy({
      where: { set_num: setNum }
    }).then(() => {
      resolve();
    }).catch((err) => {
      reject(err.errors[0].message);
    });
  });
}

module.exports = { initialize, getAllSets, getSetByNum, getSetsByTheme, addSet, getAllThemes, editSet, deleteSet };
