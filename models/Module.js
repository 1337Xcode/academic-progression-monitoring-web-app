const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');
const Programme = require('./Programme');

const Module = sequelize.define('Module', {
    module_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    subj_code: {
        type: DataTypes.STRING,
        allowNull: false
    },
    subj_catalog: {
        type: DataTypes.STRING,
        allowNull: false
    },
    module_title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    credit_value: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    semester: {
        type: DataTypes.ENUM('AUT', 'SPR', 'FULL'),
        allowNull: false
    },
    is_core: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    programme_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Programme,
            key: 'programme_id'
        }
    }
}, {
    tableName: 'modules',
    timestamps: false
});

module.exports = Module;
