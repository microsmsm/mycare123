'use strict';
module.exports = (sequelize, DataTypes) => {
  const Patient = sequelize.define('patients', {
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    gender: DataTypes.STRING,
    profession: DataTypes.STRING,
    mobile_number: DataTypes.STRING,
    birth_date: DataTypes.DATE,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  }, {
    timestamps: false,
    freezeTableName: true,

  });
  Patient.associate = function(models) {
    // associations can be defined here
    Patient.hasMany(models.visits, {foreignKey: 'patient_id'});
  };
  return Patient;
};