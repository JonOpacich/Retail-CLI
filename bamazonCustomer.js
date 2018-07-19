//dependencies
let mysql = require('mysql');
let inquirer = require('inquirer');


let productArray;
let divider = () => {
    console.log(`
    ********************************************************************
    `);
}

//database connection protocol
let connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'bamazon'
})

connection.connect((err) => {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }
    formatProductArray();
})


function formatProductArray() {
    connection.query('SELECT * from products',
        function (err, results) {
            //error-handling
            if (err) {
                console.error('error connecting: ' + err.stack);
                return;
            }

            //remove items that are out of stock
            let inStock = results.filter(obj => obj.stock_quantity > 0);
            //reformat mysql array so it can be used by inquirer
            productArray = inStock.map(obj => {


                let newObj = {
                    name: obj.product_name + ' for ' + obj.price + ' each',
                    value: obj.item_id,
                    short: obj.product_name,
                    price: obj.price,
                    department: obj.department_name,
                    quantity: obj.stock_quantity
                };
                return newObj;
            })

            chooseProduct(productArray);
        })
}

function chooseProduct(products) {
    inquirer.prompt([
        {
            type: 'list',
            name: 'item',
            message: '\n Welcome to Bamazon: the premier retail command line interface! What would you like to purchase today?',
            choices: products,
        },
    ]).then(ans => {
        let chosenItem = productArray[parseInt(ans.item) - 1];
        selectQuantity(chosenItem);
    })
}

function selectQuantity(item) {
    inquirer.prompt([
        {
            type: 'input',
            name: 'quantity',
            message: `How many ${item.short}(s) would you like?`
        },
    ]).then(ans => {
        //determine if enough product
        if (parseInt(ans.quantity) <= parseInt(item.quantity)) {
            let qtyLeft = parseInt(item.quantity) - parseInt(ans.quantity);
            updateDatabase(item.value, qtyLeft);
            continueQuery(ans.quantity, item.name);

        }
        else {
            console.log(`   Only ${item.quantity} units left in stock. Please select a lower quantity.`);
            selectQuantity(item);
        }
    })
}


function updateDatabase(id, qtyLeft) {
    connection.query("UPDATE products SET stock_quantity=? WHERE item_id = ?;", [qtyLeft, id], function (error, results, fields) {
        //error-handling
        if (error) {
            console.error('error connecting: ' + error.stack);
            return;
        }
    })
}

function continueQuery(purchaseQuantity, purchaseInfo) {
    inquirer.prompt([
        {
            type: 'confirm',
            name: 'continue',
            message: `You've purchased ${purchaseQuantity} units of ${purchaseInfo}! Do you wish to continue shopping?`
        },
    ]).then(ans => {
        if (ans.continue === true) {
            formatProductArray();
        }
        else {
            connection.end((err) => {
                //error-handling
                if (err) {
                    console.error('error connecting: ' + err.stack);
                    return;
                }
                console.log('Thank you for shopping with Bamazon. Have a great day!');
            });
        }
    })
}

