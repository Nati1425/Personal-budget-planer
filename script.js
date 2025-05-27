console.log("script.js: File loaded.");

document.addEventListener('DOMContentLoaded', () => {
    // --- Main Transaction Form Elements ---
    const addTransactionItemForm = document.getElementById('addTransactionItemForm');
    const itemTypeSelect = document.getElementById('itemType');
    const itemDescriptionInput = document.getElementById('itemDescription');
    const itemAmountInput = document.getElementById('itemAmount');
    const itemEthiopianMonthTransactionSelect = document.getElementById('itemEthiopianMonth_transaction');

    // --- Reminder Form Elements ---
    const addReminderForm = document.getElementById('addReminderForm');
    const reminderTypeSelect = document.getElementById('reminderType');
    const reminderDescriptionInput = document.getElementById('reminderDescription');
    const reminderAmountInput = document.getElementById('reminderAmount');
    const reminderEthiopianMonthSelect = document.getElementById('reminderEthiopianMonth'); // New
    const userReminderListUL = document.getElementById('userReminderList');

    // --- Reminder Summary Display ---
    const totalExpectedIncomeSpan = document.getElementById('totalExpectedIncome'); // New
    const totalExpectedExpenseSpan = document.getElementById('totalExpectedExpense'); // New

    // --- Display Lists for Actual Transactions ---
    const incomeList = document.getElementById('incomeList');
    const expenseList = document.getElementById('expenseList');

    // --- Totals and Balance (Actuals) ---
    const totalIncomeSpan = document.getElementById('totalIncome');
    const totalExpensesSpan = document.getElementById('totalExpenses');
    const balanceSpan = document.getElementById('balance');

    // --- Action Buttons ---
    const clearTransactionsButton = document.getElementById('clearTransactionsButton');
    const clearRemindersButton = document.getElementById('clearRemindersButton');

    const CURRENCY_SYMBOL = "ETB";

    // --- Data Storage ---
    let actualTransactions = loadActualTransactions();
    let userReminders = loadUserReminders();

    // --- Event Listeners ---
    if (addTransactionItemForm) {
        addTransactionItemForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addAdhocTransaction();
        });
    }

    if (addReminderForm) {
        addReminderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addNewReminder();
        });
    }

    if (userReminderListUL) {
        userReminderListUL.addEventListener('click', handleReminderListActions);
    }

    if (incomeList) incomeList.addEventListener('click', handleDeleteActualTransaction);
    if (expenseList) expenseList.addEventListener('click', handleDeleteActualTransaction);

    if (clearTransactionsButton) {
        clearTransactionsButton.addEventListener('click', () => {
            if (confirm("ሁሉንም ትክክለኛ የገቢ/ወጪ መረጃ ማጽዳት እንደሚፈልጉ እርግጠኛ ነዎት?")) {
                actualTransactions = [];
                saveActualTransactions();
                renderActualTransactions();
            }
        });
    }
    if (clearRemindersButton) {
        clearRemindersButton.addEventListener('click', () => {
            if (confirm("ሁሉንም የተቀመጡ ማስታወሻዎች ማጽዳት እንደሚፈልጉ እርግጠኛ ነዎት?")) {
                userReminders = [];
                saveUserReminders();
                renderUserReminders(); // This will also update reminder totals
            }
        });
    }

    // --- Reminder Functions ---
    function addNewReminder() {
        const type = reminderTypeSelect.value;
        const description = reminderDescriptionInput.value.trim();
        const amount = parseFloat(reminderAmountInput.value);
        const monthValue = reminderEthiopianMonthSelect.value; // Get month for reminder
        let monthDisplay = null;

        if (monthValue) {
            const selectedOption = reminderEthiopianMonthSelect.options[reminderEthiopianMonthSelect.selectedIndex];
            if (selectedOption) monthDisplay = selectedOption.text;
        }

        if (description === '' || isNaN(amount) || amount <= 0) {
            alert('ለማስታወሻው እባክዎ ትክክለኛ መግለጫ እና ከዜሮ በላይ የሆነ ግምት ያስገቡ።');
            return;
        }
        const newReminder = {
            id: Date.now(),
            type,
            description,
            amount,
            ethiopianMonthValue: monthValue || null, // Store value
            ethiopianMonthDisplay: monthDisplay || null // Store display text
        };
        userReminders.push(newReminder);
        saveUserReminders();
        renderUserReminders(); // This will also update reminder totals
        addReminderForm.reset();
        reminderEthiopianMonthSelect.value = ""; // Explicitly reset month dropdown
        reminderDescriptionInput.focus();
    }

    function renderUserReminders() {
        if (!userReminderListUL) return;
        userReminderListUL.innerHTML = '';
        let expectedIncome = 0;
        let expectedExpense = 0;

        if (userReminders.length === 0) {
            userReminderListUL.innerHTML = '<li>ምንም የተቀመጡ ማስታወሻዎች የሉም።</li>';
        } else {
            userReminders.forEach(reminder => {
                const listItem = document.createElement('li');
                const typeInAmharic = reminder.type === 'income' ? 'የሚጠበቅ ገቢ' : 'የሚጠበቅ ወጪ';
                
                let monthDisplayHtml = '';
                if (reminder.ethiopianMonthDisplay) {
                    monthDisplayHtml = `<span class="reminder-item-month">የማስታወሻ ወር: ${reminder.ethiopianMonthDisplay}</span>`;
                }

                listItem.innerHTML = `
                    <div class="reminder-details">
                        <span class="reminder-item-description">${reminder.description}</span>
                        <span class="reminder-item-type">${typeInAmharic}</span>
                        <span class="reminder-item-amount">ግምት: ${reminder.amount.toFixed(2)} ${CURRENCY_SYMBOL}</span>
                        ${monthDisplayHtml}
                    </div>
                    <div class="reminder-actions">
                        <button class="add-to-actuals-btn" data-id="${reminder.id}">እንደ ትክክለኛ ጨምር</button>
                        <button class="delete-reminder-btn" data-id="${reminder.id}">ማስታወሻ ሰርዝ</button>
                    </div>
                `;
                userReminderListUL.appendChild(listItem);

                // Calculate totals for reminders
                if (reminder.type === 'income') {
                    expectedIncome += reminder.amount;
                } else if (reminder.type === 'expense') {
                    expectedExpense += reminder.amount;
                }
            });
        }
        // Update reminder total displays
        if(totalExpectedIncomeSpan) totalExpectedIncomeSpan.textContent = expectedIncome.toFixed(2);
        if(totalExpectedExpenseSpan) totalExpectedExpenseSpan.textContent = expectedExpense.toFixed(2);
    }

    function handleReminderListActions(e) {
        const target = e.target;
        const reminderId = parseInt(target.dataset.id);
        const reminder = userReminders.find(r => r.id === reminderId);

        if (!reminder) return;

        if (target.classList.contains('add-to-actuals-btn')) {
            const actualAmountStr = prompt(`"${reminder.description}" ለሚለው ትክክለኛውን መጠን ያስገቡ (ግምት: ${reminder.amount.toFixed(2)} ${CURRENCY_SYMBOL}):`, reminder.amount.toFixed(2));
            if (actualAmountStr === null) return;

            const actualAmount = parseFloat(actualAmountStr);
            if (isNaN(actualAmount) || actualAmount <= 0) {
                alert('እባክዎ ትክክለኛ መጠን ያስገቡ።');
                return;
            }

            // For the actual transaction, use the reminder's month if set,
            // otherwise, allow user to pick from the main transaction form's month selector.
            let transactionMonthValue = reminder.ethiopianMonthValue;
            let transactionMonthDisplay = reminder.ethiopianMonthDisplay;

            if (!transactionMonthValue) { // If reminder had no month, check the main form
                const selectedMonthValueFromForm = itemEthiopianMonthTransactionSelect.value;
                if (selectedMonthValueFromForm) {
                    transactionMonthValue = selectedMonthValueFromForm;
                    const monthOption = Array.from(itemEthiopianMonthTransactionSelect.options).find(opt => opt.value === selectedMonthValueFromForm);
                    if(monthOption) transactionMonthDisplay = monthOption.text;
                }
            }
            // Clear main form month selector if it was just used for this one-off.
            itemEthiopianMonthTransactionSelect.value = "";


            const newTransaction = {
                id: Date.now(),
                type: reminder.type,
                description: reminder.description,
                amount: actualAmount,
                ethiopianMonthValue: transactionMonthValue,
                ethiopianMonthDisplay: transactionMonthDisplay
            };
            addTransactionToActualsList(newTransaction);
        } else if (target.classList.contains('delete-reminder-btn')) {
            if (confirm(`"${reminder.description}" የሚለውን ማስታወሻ መሰረዝ እርግጠኛ ነዎት?`)) {
                userReminders = userReminders.filter(r => r.id !== reminderId);
                saveUserReminders();
                renderUserReminders(); // Update list and totals
            }
        }
    }

    function saveUserReminders() {
        localStorage.setItem('budgetPlannerUserReminders', JSON.stringify(userReminders));
    }

    function loadUserReminders() {
        const storedReminders = localStorage.getItem('budgetPlannerUserReminders');
        if (storedReminders) {
            try {
                return JSON.parse(storedReminders).map(r => ({
                    ...r, // Spread existing properties
                    ethiopianMonthValue: r.ethiopianMonthValue || null, // Ensure properties exist
                    ethiopianMonthDisplay: r.ethiopianMonthDisplay || null
                }));
            } catch (e) { console.error("Error parsing user reminders:", e); return [];}
        }
        return [];
    }

    // --- Actual Transaction Functions (mostly unchanged from previous version) ---
    function addAdhocTransaction() {
        const type = itemTypeSelect.value;
        const description = itemDescriptionInput.value.trim();
        const amount = parseFloat(itemAmountInput.value);
        const ethiopianMonthValue = itemEthiopianMonthTransactionSelect.value;
        let ethiopianMonthDisplay = null;

        if (ethiopianMonthValue) {
            const selectedOption = itemEthiopianMonthTransactionSelect.options[itemEthiopianMonthTransactionSelect.selectedIndex];
            if (selectedOption) ethiopianMonthDisplay = selectedOption.text;
        }

        if (description === '' || isNaN(amount) || amount <= 0) {
            alert('እባክዎ ትክክለኛ መግለጫ እና ከዜሮ በላይ የሆነ መጠን ያስገቡ።');
            return;
        }
        const newTransaction = {
            id: Date.now(), type, description, amount,
            ethiopianMonthValue: ethiopianMonthValue || null,
            ethiopianMonthDisplay: ethiopianMonthDisplay || null
        };
        addTransactionToActualsList(newTransaction);
        addTransactionItemForm.reset();
        itemEthiopianMonthTransactionSelect.value = ""; // Explicitly reset month dropdown
        itemDescriptionInput.focus();
    }
    
    function addTransactionToActualsList(transactionObject) {
        actualTransactions.push(transactionObject);
        saveActualTransactions();
        renderActualTransactions();
        console.log("Actual transaction added:", transactionObject);
    }

    function renderActualTransactions() {
        if(incomeList) incomeList.innerHTML = '';
        if(expenseList) expenseList.innerHTML = '';
        let currentTotalIncome = 0;
        let currentTotalExpenses = 0;

        actualTransactions.forEach(item => {
            const listItem = document.createElement('li');
            listItem.classList.add(item.type === 'income' ? 'income-item' : 'expense-item');
            let monthDisplayHtml = '';
            if (item.ethiopianMonthDisplay) {
                monthDisplayHtml = `<span class="item-month">ወር: ${item.ethiopianMonthDisplay}</span>`;
            }
            listItem.innerHTML = `
                <div class="item-details">
                    <span class="item-description">${item.description}</span>
                    ${monthDisplayHtml}
                </div>
                <div class="item-amount-controls">
                    <span class="item-amount">${item.amount.toFixed(2)} ${CURRENCY_SYMBOL}</span>
                    <button class="delete-btn" data-id="${item.id}">ሰርዝ</button>
                </div>
            `;
            if (item.type === 'income' && incomeList) {
                incomeList.appendChild(listItem);
                currentTotalIncome += item.amount;
            } else if (item.type === 'expense' && expenseList) {
                expenseList.appendChild(listItem);
                currentTotalExpenses += item.amount;
            }
        });

        if(totalIncomeSpan) totalIncomeSpan.textContent = `${currentTotalIncome.toFixed(2)}`;
        if(totalExpensesSpan) totalExpensesSpan.textContent = `${currentTotalExpenses.toFixed(2)}`;
        if(balanceSpan) {
            const balance = currentTotalIncome - currentTotalExpenses;
            balanceSpan.textContent = `${balance.toFixed(2)} ${CURRENCY_SYMBOL}`;
            balanceSpan.className = balance >= 0 ? 'balance-positive' : 'balance-negative';
        }
    }

    function handleDeleteActualTransaction(e) {
        if (e.target.classList.contains('delete-btn')) {
            const transactionId = parseInt(e.target.dataset.id);
            actualTransactions = actualTransactions.filter(t => t.id !== transactionId);
            saveActualTransactions();
            renderActualTransactions();
        }
    }

    function saveActualTransactions() {
        localStorage.setItem('budgetPlannerActualTransactions', JSON.stringify(actualTransactions));
    }

    function loadActualTransactions() {
        const storedTransactions = localStorage.getItem('budgetPlannerActualTransactions');
        if (storedTransactions) {
            try {
                return JSON.parse(storedTransactions).map(item => ({
                    ...item,
                    ethiopianMonthValue: item.ethiopianMonthValue || item.ethiopianMonth || null,
                    ethiopianMonthDisplay: item.ethiopianMonthDisplay || null
                }));
            } catch (e) { console.error("Error parsing actual transactions:", e); return []; }
        }
        return [];
    }

    // --- Initial Page Setup ---
    renderUserReminders();      // Render reminders and their totals
    renderActualTransactions(); // Render actual transactions and their totals
});