const _ = require('underscore');
const Visit = require('../models').visits;
const Patient = require('../models').patients;
const VisitsTests = require('../models').visits_tests;
const Tests = require('../models').tests;
const ItemsResultsValue = require('../models').items_results_value;
const TestItem =  require('../models').tests_items;
const sequelize = require('../models').sequelize;
const genenrateVisitReport = require('../helpers/genenrate-visit-report');


//HELPERS

function updateRow(id, value) {
    return ItemsResultsValue.update(
      {
        value,
      },
      {
        where: { id },
      }
    );
  }


  function buildRowPromises(arr) {
    return arr.map((obj) => updateRow(obj.id, obj.value));
  }
  
module.exports = {

    updateResults: (request, response) => {

        let data = request.body;


        return Promise.all(buildRowPromises(data)).then(res => {
            response.status(200).send('done')

        }).catch(e => {
            console.log('error:    ', e)
        })

    },   
    findResultsReportByVisitId: (request, response) => {

        const id = request.params.id;
        // Get results for this vist
         sequelize.query(`
            SELECT distinct
            items_results_values.id, items_results_values.value, tests_items.name as item_name, 
            items_results_values.item_id, tests.name as test_name, visits_tests.test_id as test_id,
            visits.created_at as visit_created_at, patients.name as patient_name, patients.gender as patient_gender,
            tests_items.normal_range as item_normal_range
            FROM items_results_values 
            inner join visits_tests on items_results_values.visit_test_id = visits_tests.id
            inner join visits on visits_tests.visit_id = visits.id
            inner join patients on patients.id = visits.patient_id
            inner join tests_items on items_results_values.item_id = tests_items.id
            inner join tests on visits_tests.test_id = tests.id
            where visits.id = ${id}

         `) .then(res => {
            
            // Use res[0] not res becsues res array have duplicated date
            const newResults = groupBy(res[0], "test_id");

            function groupBy(arr, key){
                let newArr = {};
            
                arr.forEach(element => {
                    if(newArr[element.test_id] && newArr[element.test_id] instanceof Array){
                        newArr[element.test_id].push(element);
                    }else{
                        newArr[element.test_id] = [element];            
                    }
                });

                return newArr;
            }
            
            // We don't need spread here, since only the results will be returned for select queries
            genenrateVisitReport(newResults, id).then(res => {

                response.status(200).send(res)
            });

                // response.status(200).send(newResults)
 
          })


    },
    findResultsByVisitId: (request, response) => {

        const id = request.params.id;
        // Get results for this vist
         sequelize.query(`
            SELECT 
            items_results_values.id, items_results_values.value, tests_items.name as item_name, 
            items_results_values.item_id, tests.name as test_name
            FROM items_results_values 
            inner join visits_tests on items_results_values.visit_test_id = visits_tests.id
            inner join visits on visits_tests.visit_id = visits.id
            inner join tests_items on items_results_values.item_id = tests_items.id
            inner join tests on visits_tests.test_id = tests.id
            where visits.id = ${id}

         `) .then(res => {
            // We don't need spread here, since only the results will be returned for select queries
            response.status(200).send(res)
          })


    },
    create: (request, response) => {
        request.body.created_at = new Date();
        request.body.updated_at = new Date();
        const testsIds = request.body.tests_ids || [];

        Visit.create(request.body)
            .then(visit => {
                const visitsTests = testsIds.map(test_id => ({
                    test_id,
                    visit_id: visit.id
                }));
                
                VisitsTests.bulkCreate(visitsTests)

                .then(resAfterCreateBulkVisitsTests => { // After create bulk test visits


                    VisitsTests.findAll({
                        where: {
                            visit_id: visit.id
                        },
                        attributes: ['id', 'test_id', 'visit_id']
                    }).then(visitTests=> {
                        //TODO Get test items
                        TestItem.findAll({
                            where:{
                                test_id: testsIds
                            }
                        }).then(items => {
                            
                            visitTests = visitTests.map(x => x.toJSON());
                            let data = [];
                            visitTests.forEach(visitTest => {
                                let obj = {};
                                items.forEach(item => {
                                    if(item.test_id == visitTest.test_id){
                                        obj = {
                                            visit_test_id: visitTest.id,
                                            item_id: item.id
                                        }
                                        data.push(obj)
                                    }
                                });
                            });

                            ItemsResultsValue.bulkCreate(data).then(afterCreateResults => {
                                response.status(200).send(afterCreateResults)

                            }).catch(e => {
                                console.log('error on insert bulk for items results values ', e)
                            })

                         }).catch(e => {
                             console.log('error on get test items: ', e);
                             
                         })
                       


                    }).catch(e => {
                        console.log('error: ' , e);
                        
                    })
                })
                .catch(error => response.status(500).send(error))
            })
            .catch(error => response.status(500).send(error));

    },

    findAll: (request, response) => {
        Visit.findAll({
            include: [
                {model: Patient},
                {model: Tests}
            ]
        })
            .then(result => {
                response.status(200).send(result);
            })
            .catch(error => {
                console.log(1, error)
                response.status(500).send(error);
            });
    },

    findById: (request, response) => {
        Visit.findById(request.params.id, {
            include: [
                {model: Patient},
                {model: Tests},
            ]
        })
            .then(result => {
                response.status(200).send(result);
            })
            .catch(error => {
                response.status(500).send(error);
            });
    },

    update: (request, response) => {
        const patient = request.body;
        const id = request.params.id;
        Visit.update(patient, { where: { id } })
            .then(result => {
                Visit.findById(id).then(updatedVisit => {
                    response.status(200).send(updatedVisit);
                }).catch(error => {
                    response.status(500).send(error);
                })
            })
            .catch(error => {
                response.status(500).send(error);
            });
    },


    delete: (request, response) => {
        const id = request.params.id;
        Visit.findById(id).then(patient => {
            patient.destroy();
            response.status(200).send();
        }).catch(error => {
            response.status(500).send(error);
        })

    },



}