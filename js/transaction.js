(function($) {
    window.chartColors = {
        red: 'rgb(255, 99, 132)',
        orange: 'rgb(255, 159, 64)',
        yellow: 'rgb(255, 205, 86)',
        green: 'rgb(75, 192, 192)',
        blue: 'rgb(54, 162, 235)',
        purple: 'rgb(153, 102, 255)',
        grey: 'rgb(201, 203, 207)'
    };
    var ctx = document.getElementById('canvas').getContext('2d');
    var barChartData = {
        labels: [],
        datasets: []
    };
    var myBar = new Chart(ctx, {
        type: 'bar',
        data: barChartData
    });

    function GotoDashboard() {
        var pathDash = drupalSettings.path.baseUrl;
        var paramPath = drupalSettings.path.currentPath.replace("transaction");
        window.location.href = pathDash + paramPath;
    }

    function GotoSubscription() {
        var pathDash = drupalSettings.path.baseUrl;
        var paramPath = drupalSettings.path.currentPath.replace("transaction");
        window.location.href = pathDash + paramPath + "subscriptions";
    }

    function resetTable(idTable) {
        $('#' + idTable).html("<thead></thead> <tbody></tbody>");
    }

    function buildHeader(obj, idTable) {
        var tr = '<tr>';
        for (var i = 0; i < Object.keys(obj).length; i++) {
            tr += '<th>' + Object.keys(obj)[i] + '</th>';
        }

        tr += '</tr>';
        $('#' + idTable + ' thead').append(tr);
    }

    function buildBody(obj, idTable) {
        var tr = buildStringBody(obj, 0);
        $('#' + idTable + ' tbody').append(tr);
    }

    function buildStringBody(obj, subBD) {
        if (obj != null) {
            if (subBD > 0) {
                var tr = '<ul>';
                for (var i = 0; i < Object.keys(obj).length; i++) {
                    if (typeof obj[Object.keys(obj)[i]] === 'object') {
                        tr += buildStringBody(obj[Object.keys(obj)[i]], 1);
                    } else {
                        tr += '<li>' + Object.keys(obj)[i] + ": " + obj[Object.keys(obj)[i]] + '</li>';
                    }
                }
                tr += '</ul>';
                return tr;
            } else {
                var tr = '<tr>';
                for (var i = 0; i < Object.keys(obj).length; i++) {
                    if (typeof obj[Object.keys(obj)[i]] === 'object') {
                        tr += '<td>' + buildStringBody(obj[Object.keys(obj)[i]], 1) + '</td>';
                    } else {
                        tr += '<td>' + obj[Object.keys(obj)[i]] + '</td>';
                    }
                }
                tr += '</tr>';
                return tr;
            }
        }
    }

    function BuildTable(idElement, data, className) {
        var $html = '';
        $html += '<div class="row"><div class="col-md-12">';
        $html += '<table id="' + idElement + '" class="' + className + '">';
        $html += '</thead></thead>';
        $html += '</tbody></tbody>';
        $html += '</table>';
        $html += '</div></div>';
        if (data != null && data != '') {
            buildHeader(data);
            buildBody(data);
        }
    };

    function BuildInput(idElement, type, className, valuedata) {
        var $html = '';

        $html += '<div class="col-md-6"><input type="' + type + '" id="' + idElement + '" name="' + idElement + '" class="' + className + '" /></div>';

        return $html;
    }

    function BuilFormFilter() {
        var $html = '';
        $html += '<div class="row"><div class="col-md-12"><div class="form-group row">';
        $html += BuildInput('appId', 'textbox', 'form-control', '');
        $html += BuildInput('fromDate', 'textbox', 'form-control datepicker', '');
        $html += BuildInput('toDate', 'textbox', 'form-control datepicker', '');
        $html += '</div></div></div>';
        $html += '<div class="row"><div class="col-md-12"><div class="form-group row">';
        $html += BuildInput('btnClick', 'button', 'btn-primary', '');
        $html += '</div></div></div>';
        $html += BuildTable('tbData', null);
        return $html;
    }

    function BinderForm() {
        var $html = BuilFormFilter();
        $('#apiTable').html($html);
    }

    function BuildSelectInput(data) {
        var valueSelect = $('#filterselect').val();
        $('#filterselect').html('');
        var select = document.getElementById('filterselect');
        var optAll = document.createElement('option');
        optAll.value = '';
        optAll.innerHTML = 'All';
        select.appendChild(optAll);
        var selectOption = [];
        for (var i = 0; i < data.length; i++) {
            var ele = data[i];
            // var DateTime = ele['datetime'];
            // var ApiId = ele['api_id'];
            var ApiName = ele['api_name'];
            // var AppId = ele['app_id'];
            // var AppName = ele['app_name'];
            // var ApiVersion = ele['api_version'];
            // var ClientId = ele['client_id'];
            // var PlanId = ele['plan_id'];
            // var PlanName = ele['plan_name'];
            // var ProductTitle = ele['product_title'];
            // var ProductVersion = ele['product_version'];
            // var RequestMethod = ele['request_method'];
            // var StatusCode = ele['status_code'];
            // var TimeRequest = ele['time_to_serve_request'];
            // var UriPath = ele['uri_path'];
            var founded = false;
            for (var j = 0; j < selectOption.length; j++) {
                var element = selectOption[j];
                if (element == ApiName) {
                    founded = true;
                    break;
                }
            }
            if (!founded) {
                if (ApiName.indexOf('ocb-oauth-provider') < 0) {
                    selectOption.push(ApiName);
                }
            }
        }
        selectOption.sort();
        for (var i = 0; i < selectOption.length; i++) {
            var el = selectOption[i];
            var opt = document.createElement('option');
            opt.value = el;
            opt.innerHTML = ParseNameAPI(el);
            select.appendChild(opt);
        }
        $('#filterselect').val(valueSelect);
    }

    function CallAPI() {
        var inputdata = {};
        inputdata['fromDate'] = new Date($('#fromDate').val()).valueOf();
        inputdata['toDate'] = new Date($('#toDate').val()).addHours(23).addMinutes(59).valueOf();
        //.addHours(23).addMinutes(59)
        inputdata['appId'] = drupalSettings.application.id;
        inputdata['size'] = $('#size').val();
        $.ajax({
            type: 'POST',
            url: drupalSettings.path.baseUrl + 'apianalytic/get',
            data: inputdata,
            beforeSend: function() {
                resetTable('lstSumary');
                resetTable('lst');
                resetTable('log');
            },
            success: function(obj) {
                if (obj.data != undefined) {
                    var objSerialize = ParseToJson(obj.data.content);
                    var data = [];
                    for (var i = 0; i < objSerialize.responses[0].hits.hits.length; i++) {
                        data.push(objSerialize.responses[0].hits.hits[i]._source);
                    }
                    BuildSelectInput(data);
                    var transationSumary = BuilDataTransactionSumary(data);
                    if (transationSumary.length > 0) {
                        buildHeader(transationSumary[0], 'lstSumary');
                        for (var i = 0; i < transationSumary.length; i++) {
                            buildBody(transationSumary[i], 'lstSumary');
                        }
                    }
                    // $('#lstSumary').DataTable({
                    //     "scrollX": true,
                    //     "scrollY": 400,
                    // });
                    BuildCanvasChart(transationSumary);
                    var transactionList = BuilDataListTransaction(data);
                    if (transactionList.length > 0) {
                        buildHeader(transactionList[0], 'lst');
                        for (var i = 0; i < transactionList.length; i++) {
                            buildBody(transactionList[i], 'lst');
                        }
                    }
                    // $('#lst').DataTable({
                    //     "scrollX": true,
                    //     "scrollY": 400,
                    // });
                    // buildHeader(objSerialize.responses[0].hits.hits[0]._source, 'log');
                    // for (var i = 0; i < objSerialize.responses[0].hits.hits.length; i++) {
                    //     buildBody(objSerialize.responses[0].hits.hits[i]._source, 'log');
                    // }
                }
            },
            error: function(err) {
                console.log(err);
            },
            complete: function() {
                $('#filter').show();
            }
        });
    }
    Date.prototype.addDays = function(days) {
        var date = new Date(this.valueOf());
        date.setDate(date.getDate() + days);
        return date;
    }
    Date.prototype.addHours = function(h) {
        this.setTime(this.getTime() + (h * 60 * 60 * 1000));
        return this;
    }
    Date.prototype.addMinutes = function(m) {
        this.setTime(this.getTime() + (m * 60 * 1000));
        return this;
    }

    Date.prototype.ConvertCodeStringDate = function() {
        return this.getDate() + "/" + (this.getMonth() + 1) + "/" + this.getFullYear() + " " + this.getHours() + ":" + this.getMinutes() + ":" + this.getSeconds();
    }

    function sameDay(d1, d2) {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    }

    function ParseToJson(str) {
        var result;
        try {
            result = JSON.parse(str);
        } catch (e) {
            return "";
        }
        return result;
    }

    function BuilDataTransactionSumary(data) {
        var selectFilter = $('#filterselect').val();
        var transactionsumary = [];
        var beginDate = new Date($('#fromDate').val());
        var endDate = new Date($('#toDate').val());
        var rangeDate = [];
        var rangeNameTrans = [];
        rangeDate.push(beginDate);
        var start = beginDate;
        if (beginDate == endDate) {
            rangeDate.push(beginDate);
        } else {
            while (start < endDate) {
                start = start.addDays(1);
                rangeDate.push(start);
            }
            //rangeDate.push(endDate);
        }

        for (var i = 0; i < data.length; i++) {
            if (data[i].api_name.indexOf('ocb-oauth-provider') < 0) {
                var nameTransaction = data[i].uri_path.split('/')[data[i].uri_path.split('/').length - 1];
                var countHas = 0;
                for (var j = 0; j < rangeNameTrans.length; j++) {
                    if (rangeNameTrans[j] == nameTransaction) {
                        countHas++;
                    }
                }
                if (countHas == 0) {
                    rangeNameTrans.push(nameTransaction);
                }
            }
        }
        for (var d = 0; d < rangeDate.length; d++) {
            //var transName = '';
            var CountTransaction = 0;
            var FailedCount = 0;
            var SuccessCount = 0;
            var PreCountTransaction = 0;
            var PreTotalAmount = 0;
            var TotalAmount = 0;
            var NetAmount = 0;
            var DatatransactionDate = rangeDate[d];
            var TransactionDate = rangeDate[d].toLocaleDateString();
            //for (k = 0; k < rangeNameTrans.length; k++) {
            //transName = rangeNameTrans[k];
            for (var i = 0; i < data.length; i++) {
                if (data[i].api_name.indexOf('ocb-oauth-provider') < 0) {
                    var obj = data[i];
                    if (selectFilter == '') {
                        var dateTrans = new Date(obj.datetime);
                        if (sameDay(dateTrans, DatatransactionDate)) {
                            CountTransaction++;
                            // if (obj.request_body.indexOf('tranferAmount') >= 0) {
                            //     CountTransaction++;
                            // } else if (obj.request_body.indexOf('amount') >= 0) {
                            //     CountTransaction++;
                            // }
                            if (obj.status_code.indexOf("200 OK") >= 0) {
                                SuccessCount++;
                                if (obj.request_body.indexOf('tranferAmount') >= 0) {
                                    var objectRequest = ParseToJson(obj.request_body);
                                    if (objectRequest != "") {
                                        if (obj.request_body.indexOf('fastTransfer') >= 0) {
                                            TotalAmount += ParseToFloat(objectRequest.data.fastTransfer.tranferAmount);
                                        } else if (obj.request_body.indexOf('externalTransfer') >= 0) {
                                            TotalAmount += ParseToFloat(objectRequest.data.externalTransfer.tranferAmount);
                                        } else if (obj.request_body.indexOf('internalTransfer') >= 0) {
                                            TotalAmount += ParseToFloat(objectRequest.data.internalTransfer.tranferAmount);
                                        } else if (obj.request_body.indexOf('billPaymentInfo') >= 0) {
                                            TotalAmount += ParseToFloat(objectRequest.data.billPaymentInfo.tranferAmount);
                                        } else if (obj.request_body.indexOf('batchPayment') >= 0) {
                                            if (objectRequest.data.batchPayment.batchItem != undefined) {
                                                for (var j = 0; j < objectRequest.data.batchPayment.batchItem.length; j++) {
                                                    TotalAmount += ParseToFloat(objectRequest.data.batchPayment.batchItem[j].tranferAmount);
                                                }
                                            }
                                        }
                                    }
                                } else if (obj.request_body.indexOf('amount') >= 0) {
                                    var objectRequest = ParseToJson(obj.request_body);
                                    if (objectRequest != "") {
                                        if (obj.request_body.indexOf('fastTransfer') >= 0) {
                                            TotalAmount += ParseToFloat(objectRequest.data.fastTransfer.amount);
                                        } else if (obj.request_body.indexOf('externalTransfer') >= 0) {
                                            TotalAmount += ParseToFloat(objectRequest.data.externalTransfer.amount);
                                        } else if (obj.request_body.indexOf('internalTransfer') >= 0) {
                                            TotalAmount += ParseToFloat(objectRequest.data.internalTransfer.amount);
                                        } else if (obj.request_body.indexOf('billPaymentInfo') >= 0) {
                                            TotalAmount += ParseToFloat(objectRequest.data.billPaymentInfo.amount);
                                        } else if (obj.request_body.indexOf('batchPayment') >= 0) {
                                            if (objectRequest.data.batchPayment.batchItem != undefined) {
                                                for (var j = 0; j < objectRequest.data.batchPayment.batchItem.length; j++) {
                                                    TotalAmount += ParseToFloat(objectRequest.data.batchPayment.batchItem[j].amount);
                                                }
                                            }
                                        }
                                    }
                                }
                            } else {
                                FailedCount++;
                                if (obj.request_body.indexOf('tranferAmount') >= 0) {
                                    var objectRequest = ParseToJson(obj.request_body);
                                    if (objectRequest != "") {
                                        if (obj.request_body.indexOf('fastTransfer') >= 0) {
                                            PreTotalAmount += ParseToFloat(objectRequest.data.fastTransfer.tranferAmount);
                                        } else if (obj.request_body.indexOf('externalTransfer') >= 0) {
                                            PreTotalAmount += ParseToFloat(objectRequest.data.externalTransfer.tranferAmount);
                                        } else if (obj.request_body.indexOf('internalTransfer') >= 0) {
                                            PreTotalAmount += ParseToFloat(objectRequest.data.internalTransfer.tranferAmount);
                                        } else if (obj.request_body.indexOf('billPaymentInfo') >= 0) {
                                            PreTotalAmount += ParseToFloat(objectRequest.data.billPaymentInfo.tranferAmount);
                                        } else if (obj.request_body.indexOf('batchPayment') >= 0) {
                                            if (objectRequest.data.batchPayment.batchItem != undefined) {
                                                for (var j = 0; j < objectRequest.data.batchPayment.batchItem.length; j++) {
                                                    PreTotalAmount += ParseToFloat(objectRequest.data.batchPayment.batchItem[j].tranferAmount);
                                                }
                                            }
                                        }
                                    }
                                } else if (obj.request_body.indexOf('amount') >= 0) {
                                    var objectRequest = ParseToJson(obj.request_body);
                                    if (objectRequest != "") {
                                        if (obj.request_body.indexOf('fastTransfer') >= 0) {
                                            PreTotalAmount += ParseToFloat(objectRequest.data.fastTransfer.amount);
                                        } else if (obj.request_body.indexOf('externalTransfer') >= 0) {
                                            PreTotalAmount += ParseToFloat(objectRequest.data.externalTransfer.amount);
                                        } else if (obj.request_body.indexOf('internalTransfer') >= 0) {
                                            PreTotalAmount += ParseToFloat(objectRequest.data.internalTransfer.amount);
                                        } else if (obj.request_body.indexOf('billPaymentInfo') >= 0) {
                                            PreTotalAmount += ParseToFloat(objectRequest.data.billPaymentInfo.amount);
                                        } else if (obj.request_body.indexOf('batchPayment') >= 0) {
                                            if (objectRequest.data.batchPayment.batchItem != undefined) {
                                                for (var j = 0; j < objectRequest.data.batchPayment.batchItem.length; j++) {
                                                    PreTotalAmount += ParseToFloat(objectRequest.data.batchPayment.batchItem[j].amount);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        if (obj.api_name == selectFilter) {
                            var dateTrans = new Date(obj.datetime);
                            if (sameDay(dateTrans, DatatransactionDate)) {
                                CountTransaction++;
                                // if (obj.request_body.indexOf('tranferAmount') >= 0) {
                                //     CountTransaction++;
                                // } else if (obj.request_body.indexOf('amount') >= 0) {
                                //     CountTransaction++;
                                // }
                                if (obj.status_code.indexOf("200 OK") >= 0) {
                                    SuccessCount++;
                                    if (obj.request_body.indexOf('tranferAmount') >= 0) {
                                        var objectRequest = ParseToJson(obj.request_body);
                                        if (objectRequest != "") {
                                            if (obj.request_body.indexOf('fastTransfer') >= 0) {
                                                TotalAmount += ParseToFloat(objectRequest.data.fastTransfer.tranferAmount);
                                            } else if (obj.request_body.indexOf('externalTransfer') >= 0) {
                                                TotalAmount += ParseToFloat(objectRequest.data.externalTransfer.tranferAmount);
                                            } else if (obj.request_body.indexOf('internalTransfer') >= 0) {
                                                TotalAmount += ParseToFloat(objectRequest.data.internalTransfer.tranferAmount);
                                            } else if (obj.request_body.indexOf('billPaymentInfo') >= 0) {
                                                TotalAmount += ParseToFloat(objectRequest.data.billPaymentInfo.tranferAmount);
                                            } else if (obj.request_body.indexOf('batchPayment') >= 0) {
                                                if (objectRequest.data.batchPayment.batchItem != undefined) {
                                                    for (var j = 0; j < objectRequest.data.batchPayment.batchItem.length; j++) {
                                                        TotalAmount += ParseToFloat(objectRequest.data.batchPayment.batchItem[j].tranferAmount);
                                                    }
                                                }
                                            }
                                        }
                                    } else if (obj.request_body.indexOf('amount') >= 0) {
                                        var objectRequest = ParseToJson(obj.request_body);
                                        if (objectRequest != "") {
                                            if (obj.request_body.indexOf('fastTransfer') >= 0) {
                                                TotalAmount += ParseToFloat(objectRequest.data.fastTransfer.amount);
                                            } else if (obj.request_body.indexOf('externalTransfer') >= 0) {
                                                TotalAmount += ParseToFloat(objectRequest.data.externalTransfer.amount);
                                            } else if (obj.request_body.indexOf('internalTransfer') >= 0) {
                                                TotalAmount += ParseToFloat(objectRequest.data.internalTransfer.amount);
                                            } else if (obj.request_body.indexOf('billPaymentInfo') >= 0) {
                                                TotalAmount += ParseToFloat(objectRequest.data.billPaymentInfo.amount);
                                            } else if (obj.request_body.indexOf('batchPayment') >= 0) {
                                                if (objectRequest.data.batchPayment.batchItem != undefined) {
                                                    for (var j = 0; j < objectRequest.data.batchPayment.batchItem.length; j++) {
                                                        TotalAmount += ParseToFloat(objectRequest.data.batchPayment.batchItem[j].amount);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                } else {
                                    FailedCount++;
                                    if (obj.request_body.indexOf('tranferAmount') >= 0) {
                                        var objectRequest = ParseToJson(obj.request_body);
                                        if (objectRequest != "") {
                                            if (obj.request_body.indexOf('fastTransfer') >= 0) {
                                                PreTotalAmount += ParseToFloat(objectRequest.data.fastTransfer.tranferAmount);
                                            } else if (obj.request_body.indexOf('externalTransfer') >= 0) {
                                                PreTotalAmount += ParseToFloat(objectRequest.data.externalTransfer.tranferAmount);
                                            } else if (obj.request_body.indexOf('internalTransfer') >= 0) {
                                                PreTotalAmount += ParseToFloat(objectRequest.data.internalTransfer.tranferAmount);
                                            } else if (obj.request_body.indexOf('billPaymentInfo') >= 0) {
                                                PreTotalAmount += ParseToFloat(objectRequest.data.billPaymentInfo.tranferAmount);
                                            } else if (obj.request_body.indexOf('batchPayment') >= 0) {
                                                if (objectRequest.data.batchPayment.batchItem != undefined) {
                                                    for (var j = 0; j < objectRequest.data.batchPayment.batchItem.length; j++) {
                                                        PreTotalAmount += ParseToFloat(objectRequest.data.batchPayment.batchItem[j].tranferAmount);
                                                    }
                                                }
                                            }
                                        }
                                    } else if (obj.request_body.indexOf('amount') >= 0) {
                                        var objectRequest = ParseToJson(obj.request_body);
                                        if (objectRequest != "") {
                                            if (obj.request_body.indexOf('fastTransfer') >= 0) {
                                                PreTotalAmount += ParseToFloat(objectRequest.data.fastTransfer.amount);
                                            } else if (obj.request_body.indexOf('externalTransfer') >= 0) {
                                                PreTotalAmount += ParseToFloat(objectRequest.data.externalTransfer.amount);
                                            } else if (obj.request_body.indexOf('internalTransfer') >= 0) {
                                                PreTotalAmount += ParseToFloat(objectRequest.data.internalTransfer.amount);
                                            } else if (obj.request_body.indexOf('billPaymentInfo') >= 0) {
                                                PreTotalAmount += ParseToFloat(objectRequest.data.billPaymentInfo.amount);
                                            } else if (obj.request_body.indexOf('batchPayment') >= 0) {
                                                if (objectRequest.data.batchPayment.batchItem != undefined) {
                                                    for (var j = 0; j < objectRequest.data.batchPayment.batchItem.length; j++) {
                                                        PreTotalAmount += ParseToFloat(objectRequest.data.batchPayment.batchItem[j].amount);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            //}
            if (CountTransaction > 0) {
                transactionsumary.push({
                    //transName,
                    "Trans Date": TransactionDate,
                    "Trans Count": CountTransaction,
                    "Failed Trans": FailedCount,
                    "Success Trans": SuccessCount,
                    // "Pre Count Transaction": PreCountTransaction,
                    // "Pre Total Amount": PreTotalAmount,
                    "Post Amount": FormatAmount(TotalAmount)
                        //NetAmount
                });
            }
        }
        return transactionsumary;
    }

    function FormatAmount(str) {
        return str.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
    }

    function ParseToFloat(str) {
        var returndata = 0;
        try {
            returndata = parseFloat(str);
        } catch (e) {
            return 0;
        }
        return returndata;
    }

    function ParseNameAPI(str) {
        var replaceStr = str.replace(/-/g, ' ');
        return replaceStr[0].toUpperCase() + replaceStr.substr(1, replaceStr.length - 1);
    }

    function ConvertCodeDateString(datetimeRq) {
        return datetimeRq.getDate() + "/" + datetimeRq.getMonth() + "/" + datetimeRq.getFullYear() + " " + datetimeRq.getHours() + datetimeRq + ":" + datetimeRq.getMinutes() + ":" + datetimeRq.getSeconds();
    }

    function BuilDataListTransaction(data) {
        var selectFilter = $('#filterselect').val();
        var transactionList = [];
        for (var i = 0; i < data.length; i++) {
            if (data[i].api_name.indexOf('ocb-oauth-provider') < 0) {
                if (selectFilter == '') {
                    var obj = data[i];
                    if (obj.request_body.indexOf('fastTransfer') >= 0 || obj.request_body.indexOf('externalTransfer') >= 0 || obj.request_body.indexOf('internalTransfer') >= 0 || obj.request_body.indexOf('billPaymentInfo') >= 0) {
                        var transId = '';
                        var TransactionType = '';
                        var transName = ''
                        var ApiName = '';
                        var BankCode = '';
                        var Card_AccountNum = '';
                        var Card_AccountNumTo = '';
                        var BillCode = '';
                        var TransactionTime = new Date(obj.datetime).ConvertCodeStringDate();
                        var Status = '';
                        var Amount = 0;
                        var Description = '';
                        var requestObject = ParseToJson(obj.request_body);
                        transId = requestObject.trace.clientTransId;
                        TransactionType = obj.request_method;
                        ApiName = ParseNameAPI(obj.api_name);
                        if (obj.request_body.indexOf('fastTransfer') >= 0) {
                            transName = "Fast Transfer";
                            Card_AccountNum = requestObject.data.fastTransfer.sourceAccountNumber;
                            Card_AccountNumTo = requestObject.data.fastTransfer.payeeAccountNumber != '' ? requestObject.data.fastTransfer.payeeAccountNumber : requestObject.data.fastTransfer.payeeCardNumber;
                            BankCode = requestObject.data.fastTransfer.bankCode;
                            Amount = requestObject.data.fastTransfer.tranferAmount;
                            Description = requestObject.data.fastTransfer.transferDescription;
                        } else if (obj.request_body.indexOf('externalTransfer') >= 0) {
                            transName = "External Transfer";
                            Card_AccountNum = requestObject.data.externalTransfer.sourceAccountNumber;
                            Card_AccountNumTo = requestObject.data.externalTransfer.payeeAccountNumber;
                            BankCode = requestObject.data.externalTransfer.payeeBankId;
                            Amount = requestObject.data.externalTransfer.tranferAmount;
                            Description = requestObject.data.externalTransfer.transferDescription;
                        } else if (obj.request_body.indexOf('internalTransfer') >= 0) {
                            transName = "Internal Transfer";
                            Card_AccountNum = requestObject.data.internalTransfer.fromAccountNumber;
                            Card_AccountNumTo = requestObject.data.internalTransfer.toAccountNumber;
                            Amount = requestObject.data.internalTransfer.tranferAmount;
                            Description = requestObject.data.internalTransfer.transferDescription;
                        } else if (obj.request_body.indexOf('billPaymentInfo') >= 0) {
                            transName = "Bill Payment";
                            Card_AccountNum = requestObject.data.billPaymentInfo.debitAccount;
                            BillCode = requestObject.data.billPaymentInfo.billCode;
                            Amount = requestObject.data.billPaymentInfo.amount;
                            //Description = requestObject.data.billPaymentInfo.transferDescription;
                        } else if (obj.request_body.indexOf('batchPayment') >= 0) {
                            transName = "Batch Payment";
                            if (requestObject.data.batchPayment.batchItem != undefined) {
                                for (var j = 0; j < requestObject.data.batchPayment.batchItem.length; j++) {
                                    Card_AccountNum += requestObject.data.batchPayment.batchItem[j].payeeAccountNumber + ";";
                                    Amount += ParseToFloat(requestObject.data.batchPayment.batchItem[j].amount);
                                    Description += requestObject.data.batchPayment.batchItem[j].paymentDescription + ";";
                                }
                            }
                        }
                        Status = obj.status_code;
                        transactionList.push({
                            "Trans Id": transId,
                            //"Trans Type": TransactionType,
                            "Trans Type": transName,
                            "API Name": ApiName,
                            "Card/Account No From": Card_AccountNum,
                            "Card/Account No To": Card_AccountNumTo,
                            "Bill Code": BillCode,
                            "Trans Date": TransactionTime,
                            "Status": Status,
                            "Trans Amount": FormatAmount(Amount),
                            "Trans Desc": Description
                        });
                    }
                } else {
                    var obj = data[i];
                    if (obj.api_name == selectFilter) {
                        if (obj.request_body.indexOf('fastTransfer') >= 0 || obj.request_body.indexOf('externalTransfer') >= 0 || obj.request_body.indexOf('internalTransfer') >= 0 || obj.request_body.indexOf('billPaymentInfo') >= 0) {
                            var transId = '';
                            var TransactionType = '';
                            var transName = ''
                            var ApiName = '';
                            var BankCode = '';
                            var Card_AccountNum = '';
                            var Card_AccountNumTo = '';
                            var BillCode = '';
                            var TransactionTime = new Date(obj.datetime).ConvertCodeStringDate();
                            var Status = '';
                            var Amount = 0;
                            var Description = '';
                            var requestObject = ParseToJson(obj.request_body);
                            transId = requestObject.trace.clientTransId;
                            TransactionType = obj.request_method;
                            ApiName = ParseNameAPI(obj.api_name);
                            if (obj.request_body.indexOf('fastTransfer') >= 0) {
                                transName = "Fast Transfer";
                                Card_AccountNum = requestObject.data.fastTransfer.sourceAccountNumber;
                                Card_AccountNumTo = requestObject.data.fastTransfer.payeeAccountNumber != '' ? requestObject.data.fastTransfer.payeeAccountNumber : requestObject.data.fastTransfer.payeeCardNumber;
                                BankCode = requestObject.data.fastTransfer.bankCode;
                                Amount = requestObject.data.fastTransfer.tranferAmount;
                                Description = requestObject.data.fastTransfer.transferDescription;
                            } else if (obj.request_body.indexOf('externalTransfer') >= 0) {
                                transName = "External Transfer";
                                Card_AccountNum = requestObject.data.externalTransfer.sourceAccountNumber;
                                Card_AccountNumTo = requestObject.data.externalTransfer.payeeAccountNumber;
                                BankCode = requestObject.data.externalTransfer.payeeBankId;
                                Amount = requestObject.data.externalTransfer.tranferAmount;
                                Description = requestObject.data.externalTransfer.transferDescription;
                            } else if (obj.request_body.indexOf('internalTransfer') >= 0) {
                                transName = "Internal Transfer";
                                Card_AccountNum = requestObject.data.internalTransfer.fromAccountNumber;
                                Card_AccountNumTo = requestObject.data.internalTransfer.toAccountNumber;
                                Amount = requestObject.data.internalTransfer.tranferAmount;
                                Description = requestObject.data.internalTransfer.transferDescription;
                            } else if (obj.request_body.indexOf('billPaymentInfo') >= 0) {
                                transName = "Bill Payment";
                                Card_AccountNum = requestObject.data.billPaymentInfo.debitAccount;
                                BillCode = requestObject.data.billPaymentInfo.billCode;
                                Amount = requestObject.data.billPaymentInfo.amount;
                                //Description = requestObject.data.billPaymentInfo.transferDescription;
                            } else if (obj.request_body.indexOf('batchPayment') >= 0) {
                                transName = "Batch Payment";
                                if (requestObject.data.batchPayment.batchItem != undefined) {
                                    for (var j = 0; j < requestObject.data.batchPayment.batchItem.length; j++) {
                                        Card_AccountNum += requestObject.data.batchPayment.batchItem[j].payeeAccountNumber + ";";
                                        Amount += ParseToFloat(requestObject.data.batchPayment.batchItem[j].amount);
                                        Description += requestObject.data.batchPayment.batchItem[j].paymentDescription + ";";
                                    }
                                }
                            }
                            Status = obj.status_code;
                            transactionList.push({
                                "Trans Id": transId,
                                //"Trans Type": TransactionType,
                                "Trans Type": transName,
                                "API Name": ApiName,
                                "Card/Account No From": Card_AccountNum,
                                "Card/Account No To": Card_AccountNumTo,
                                "Bill Code": BillCode,
                                "Trans Date": TransactionTime,
                                "Status": Status,
                                "Trans Amount": FormatAmount(Amount),
                                "Trans Desc": Description
                            });
                        }
                    }
                }
            }
        }
        return transactionList;
    }

    function BuildCanvasChart(transactionsumary) {
        myBar.destroy();
        var aXisX = [];
        transactionsumary.forEach(element => {
            aXisX.push(element['Trans Date']);
        });
        var datapointSummaryFailed = [];
        var datapointSummarySuccess = [];
        transactionsumary.forEach(element => {
            datapointSummaryFailed.push(element['Failed Trans']);
            datapointSummarySuccess.push(element['Success Trans']);
        });
        var color = Chart.helpers.color;
        barChartData = {
            labels: aXisX,
            datasets: [{
                label: 'Failed Trans',
                backgroundColor: color(window.chartColors.red).alpha(0.5).rgbString(),
                borderColor: window.chartColors.red,
                borderWidth: 1,
                data: datapointSummaryFailed
            }, {
                label: 'Success Trans',
                backgroundColor: color(window.chartColors.blue).alpha(0.5).rgbString(),
                borderColor: window.chartColors.blue,
                borderWidth: 1,
                data: datapointSummarySuccess
            }],

        };

        myBar = new Chart(ctx, {
            type: 'bar',
            data: barChartData,
            options: {
                responsive: true,
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Transaction Summary',
                    fontSize: 25
                },
                scales: {
                    yAxes: [{
                        display: true,
                        ticks: {
                            beginAtZero: true
                        }
                    }]
                }
            }
        });
        $('#canvas').closest('.row').show();

        //window.myBar.update();
    }

    $(document).ready(function() {
        $('.datepicker').datepicker({
            format: 'yyyy-mm-dd'
        });
        $('#btnSearch').click(function() {
            CallAPI();
        });
        $('#filterselect').change(function() {
            CallAPI();
        });
        $('#size').change(function() {
            CallAPI();
        });

    });

}(jQuery));