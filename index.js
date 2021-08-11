(function(){
    function chunkArray(myArray, chunk_size){
        var results = [];
        
        while (myArray.length) {
            results.push(myArray.splice(0, chunk_size));
        }
        
        return results;
    }

    function downloadData(data){
        window.URL = window.webkitURL || window.URL;

        var contentType = 'text/csv';

        var csvFile = new Blob([data], {type: contentType});

        var a = document.createElement('a');
        a.download = 'wazir-data-'+ Date.now() +'.csv';
        a.href = window.URL.createObjectURL(csvFile);
        a.textContent = 'Download CSV';

        a.dataset.downloadurl = [contentType, a.download, a.href].join(':');

        document.body.appendChild(a);

        a.click();
    }

    let orders = document.querySelector(".completed-orders");
    if(!orders){
        alert("No trades found. Make sure you are on WazirX, in the Exchange tab.");
        return;
    }
    orders.click();

    setTimeout(function(){
        let container = orders.parentNode.parentNode.parentNode;
        container = container.querySelector(":scope>div:nth-child(2)>div>div>div:nth-child(3)>div>div");

        let allElements = container.querySelectorAll(":scope>div");
        let color = "rgb(0, 200, 83)";
        let elementsContainer = Array.from(allElements).filter(div => color === window.getComputedStyle(div, ":before").backgroundColor);
        if(!elementsContainer.length){
            alert("No trades found. Make sure you have made some trades in WazirX.");
            return;
        }
        let elements = [];
        elementsContainer.forEach((container)=>{
            let temp = container.querySelectorAll(":scope>div:first-child>div>span:first-child");
            elements.push(...Array.from(temp));
        });
        console.log(elements, "ELS2");

        elements = elements.map((a)=> a.innerText.split("\n")[0]);
        let elementsChunked = chunkArray(elements, 4);
        let header = ["Pair", "Amount", "Price", "Total"];
        elementsObjects = elementsChunked.map((a)=>{
            let object = {};
            a.forEach((b, i) => {
                if(i) object[header[i]] = parseFloat(b.replaceAll(",", ""));
                else object[header[i]] = b;
            });
            return object;
        });
        let sellElementsContainer = Array.from(allElements).filter(div => color !== window.getComputedStyle(div, ":before").backgroundColor);
        let sellElements = [];
        sellElementsContainer.forEach((container)=>{
            let temp = container.querySelectorAll(":scope>div:first-child>div>span:first-child");
            sellElements.push(...Array.from(temp));
        });
        console.log(sellElements, "ELS");
        sellElements = Array.from(sellElements).map((a)=> a.innerText.split("\n")[0]);
        let sellElementsChunked = chunkArray(sellElements, 4);
        sellElementsObjects = sellElementsChunked.map((a)=>{
            let object = {};
            a.forEach((b, i) => {
                if(i) object[header[i]] = parseFloat(b.replaceAll(",", ""));
                else object[header[i]] = b;
            });
            return object;
        });
        fetch('https://api.wazirx.com/api/v2/tickers').then(response => response.json()).then(tickers =>{
            let summationObject = {};
            elementsObjects.forEach((obj)=>{
                if(!summationObject.hasOwnProperty(obj.Pair)){
                    summationObject[obj.Pair] = {
                        "Amount": 0,
                        "Total": 0,
                        "Current": parseFloat(tickers[obj.Pair.toLowerCase() + "inr"].last)
                    }
                }
                summationObject[obj.Pair]["Amount"] += obj.Amount;
                summationObject[obj.Pair]["Total"] += obj.Total;  
            });

            let sellSummationObject = {};
            sellElementsObjects.forEach((obj)=>{
                if(!sellSummationObject.hasOwnProperty(obj.Pair)){
                    sellSummationObject[obj.Pair] = {
                        "Amount": 0,
                        "Total": 0
                    }
                }
                sellSummationObject[obj.Pair]["Amount"] += obj.Amount;
                sellSummationObject[obj.Pair]["Total"] += obj.Total;
            });
            let totalStats = {
                "Total Profit/Loss": 0
            };
            let summationArray = [];
            let header = ["Amount", "Total", "Current", "Price", "Difference", "Profit/Loss"];
            Object.keys(summationObject).forEach((key, i)=>{
                summationObject[key]["Price"] = summationObject[key]["Total"] / summationObject[key]["Amount"];
                if(sellSummationObject.hasOwnProperty(key)) {
                    summationObject[key]["Amount"] = summationObject[key]["Amount"] - sellSummationObject[key]["Amount"];
                    summationObject[key]["Total"] = summationObject[key]["Amount"] * summationObject[key]["Price"];
                }
                summationObject[key]["Difference"] = summationObject[key]["Current"] - summationObject[key]["Price"];
                summationObject[key]["Profit/Loss"] = summationObject[key]["Amount"] * summationObject[key]["Difference"];
                summationObject[key]["Percentage Profit/Loss"] = (summationObject[key]["Profit/Loss"] / summationObject[key]["Total"]) * 100;
                totalStats["Total Profit/Loss"] += summationObject[key]["Profit/Loss"];
                summationArray.push([]); 
                summationArray[i].push(key); 
                Object.keys(summationObject[key]).forEach((innerKey)=>{
                    summationObject[key][innerKey] = parseFloat(summationObject[key][innerKey].toFixed(4));
                    summationArray[i].push(summationObject[key][innerKey]);
                });
                summationArray[i].push(parseFloat(totalStats["Total Profit/Loss"].toFixed(4)));
            });
            header = ["Pair", "Amount", "Total", "Current", "Price", "Difference", "Profit/Loss", "Percentage Profit/Loss", "Cumulative Profit/Loss"];
            summationArray.unshift(header);
            let elementsCSV = summationArray.map(a=>a.map((b)=>'"' + b + '"').join(","));
            elementsCSV = elementsCSV.join("\n")
            downloadData(elementsCSV);
        });
        
    }, 1000);
})();