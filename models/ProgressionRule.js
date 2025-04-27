const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');
const Programme = require('./Programme');

const ProgressionRule = sequelize.define('ProgressionRule', {
    rule_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    programme_code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        references: {
            model: Programme,
            key: 'programme_code'
        }
    },
    min_pass_mark: {
        type: DataTypes.DECIMAL(5,2),
        allowNull: false,
        defaultValue: 40.00
    },
    min_avg_grade: {
        type: DataTypes.DECIMAL(5,2),
        allowNull: false,
        defaultValue: 40.00
    },
    total_credits_required: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 100
    },
    compulsory_modules: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'progression_rules',
    timestamps: false
});

module.exports = ProgressionRule;
