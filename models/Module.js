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
        type: DataTypes.STRING(10),
        allowNull: false
    },
    subj_catalog: {
        type: DataTypes.STRING(10),
        allowNull: false
    },
    module_title: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    credit_value: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 20,
        validate: {
            min: 0,
            max: 40,
            isWithinRange(value) {
                // Standard credit values are between 10 to 40
                if (value > 40) {
                    throw new Error('Credit value is unusually high. Standard modules have 10-40 credits.');
                }
            }
        }
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
    },
    pathway_code: {
        type: DataTypes.STRING(20),
        allowNull: true
    }
}, {
    tableName: 'modules',
    timestamps: false
});

module.exports = Module;
