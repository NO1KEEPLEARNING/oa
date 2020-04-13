// 表格对象
var DataTable = function (tableId, options) {
    this.tableId = tableId;
    // 表格共通式样
    this.tableStyle = {
        tdBaseClass: "", // td共通式样
    }
    // 表格变量：id、name等等
    this.tableVar = {
        selectAllRowsCheckboxId: this.tableId + "_selectAllRowsCheckboxId", // 表头：选中所有行
        selectRowCheckboxClass: this.tableId + "_selectRowCheckboxClass", // 行：选中该行checkbox类
        openRowClass: this.tableId + "_openRow", // 树：展开行
        closeRowClass: this.tableId + "_closeRow", // 树：关闭行
        selectedRowClass: "dt-selected-row", // 选中行类
        addRowClass: "dt-add-row", // 添加行类
        editRowClass: "dt-edit-row", // 编辑行类
        delRowClass: "dt-del-row", // 删除行类
        addRowBtnClass: this.tableId + "_addRowBtnClass", // 工具栏：添加行按钮
        editRowsBtnClass: this.tableId + "_editRowsBtnClass", // 工具栏：编辑行按钮
        saveRowsBtnClass: this.tableId + "_saveRowsBtnClass", // 工具栏：保存行按钮
        delRowsBtnClass: this.tableId + "_delRowsBtnClass", // 工具栏：删除行按钮
        cancelRowsBtnClass: this.tableId + "_cancelRowsBtnClass", // 工具栏：取消行按钮
        customBtnClass: this.tableId + "_customBtnClass", // 工具栏：自定义按钮前缀
        resAddList: "addRows", // 保存方法返回值：添加行
        resEditList: "editRows", // 保存方法返回值：编辑行
        resDelList: "delRows", // 保存方法返回值：删除行
        pagingContainerClass: this.tableId + "_pagingContainerContent", // 分页容器
    }

    // 默认options参数
    var defaultOptions = {
        fullGrid: true, // 表格铺满全屏(父容器)
        showCheckboxCol: true, // 显示checkbox选择列
        showLineNum: true, // 显示行号
        dataPrefix: "data", // 查询表格数据返回值默认前缀
        toolbarItem: "", // add, edit, cancel, save, del
        toolbarCustom: [], // 自定义工具栏
        oldGridData: [], // 初始化表格元素的数据
        local: 'local', // 默认前端分页
        paging: {
            pageSize: 30, // 默认每页行数
            selectPageSize: '30,60,90', // 分页大小下拉选择
            pageCurrent: 1, // 当前页
            showPageNum: 5, // 一共显示多少页
            totalRow: 0 // 总行数
        }
    };

    // paging 多级：单独处理
    if (options["paging"] != null) {
        options["paging"].pageSize = options["paging"].pageSize || 30;
        options["paging"].selectPageSize = options["paging"].selectPageSize || '30,60,90';
        options["paging"].pageCurrent = options["paging"].pageCurrent || 1;
        options["paging"].showPageNum = options["paging"].showPageNum || 5;
        options["paging"].totalRow = options["paging"].totalRow || 0;
    }

    // 替换默认option参数
    if (typeof options === "object") {
        for (key in defaultOptions) {
            if (options[key] === undefined) {
                options[key] = defaultOptions[key];
            }
        }
    }
    this.options = options;

    // 多级表头转为一级表头：递归遍历叶子节点
    var changeColumnsToOneLevel = function (columns, newColumns) {
        for (var i = 0; i < columns.length; i++) {
            var colObj = columns[i];
            if (colObj["columns"] == null) {
                newColumns.push(colObj);
            } else {
                newColumns = changeColumnsToOneLevel(colObj["columns"], newColumns);
            }
        }
        return newColumns;
    }

    // 树形显示
    if (this.options.treeOptions) {
        options.columns.unshift({
            label: "",
            type: "treeFold",
            width: 100
        });
    }

    // 显示checkbox选择列
    if (this.options.showCheckboxCol) {
        options.columns.unshift({
            label: '<input id="' + this.tableVar.selectAllRowsCheckboxId + '" type="checkbox">',
            type: "checkbox",
            width: 30
        });
    }
    // 显示行号
    if (this.options.showLineNum) {
        options.columns.unshift({
            label: "No.",
            type: "lineNum",
            width: 40
        });
    }

    // 多级表头的节点
    this.options.realColumns = options.columns;
    // 一级(叶子节点)的columns
    this.options.columns = changeColumnsToOneLevel(options.columns, []);

    // 必填参数判断
    // todo
}

// 表格事件处理共通方法
DataTable.prototype.addEventListener = function (eles, eventName, fn) {
    // 元素为空直接返回
    if (eles == null) {
        return;
    }

    if (eventName == "click") {
        // 是否多个元素
        if (eles instanceof HTMLCollection) {
            for (var i = 0; i < eles.length; i++) {
                eles[i].onclick = fn;
            }
        } else {
            eles.onclick = fn;
        }
    }
    if (eventName == "onchange") {
        // 是否多个元素
        if (eles instanceof HTMLCollection) {
            for (var i = 0; i < eles.length; i++) {
                eles[i].onchange = fn;
            }
        } else {
            eles.onchange = fn;
        }
    }
}

// 触发事件
DataTable.prototype.triggerClick = function (ele) {
    var e = document.createEvent("MouseEvents");
    // 事件名称 是否可以冒泡 是否阻止事件的默认操作
    e.initEvent("click", false, true);
    ele.dispatchEvent(e);
}

// DataTable默认ajax请求方式
// 参数 --> opts默认：type:GET dataType:json
DataTable.prototype.doAjax = function (opts) {
    var createxmlHttpRequest = function () {
        if (window.ActiveXObject) {
            return new ActiveXObject("Microsoft.XMLHTTP");
        } else if (window.XMLHttpRequest) {
            return new XMLHttpRequest();
        }
    }

    var convertData = function (data) {
        if (typeof data === 'object') {
            var convertResult = "";
            for (var c in data) {
                convertResult += c + "=" + data[c] + "&";
            }
            convertResult = convertResult.substring(0, convertResult.length - 1)
            return convertResult;
        } else {
            return data;
        }
    }

    var ajaxData = {
        type: (opts.type || "GET").toUpperCase(),
        url: opts.url || "",
        async: opts.async || "true",
        data: opts.data || null,
        dataType: opts.dataType || "json",
        contentType: opts.contentType || "application/x-www-form-urlencoded; charset=utf-8",
        beforeSend: opts.beforeSend || function () {
        },
        success: opts.success || function () {
        },
        error: opts.error || function () {
        }
    }

    ajaxData.beforeSend()
    var xhr = createxmlHttpRequest();
    xhr.responseType = ajaxData.dataType;

    xhr.open(ajaxData.type, ajaxData.url, ajaxData.async);
    xhr.setRequestHeader("Content-Type", ajaxData.contentType);
    xhr.send(convertData(ajaxData.data));

    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                ajaxData.success(xhr.response)
            } else {
                ajaxData.error()
            }
        }
    }
}

// DataTable默认弹出框
DataTable.prototype.alertMsg = function (opt) {
    console.log("DataTable默认弹出框");
    alert(opt.msg);
}

// 判断元素是否包含类
DataTable.prototype.hasClass = function (ele, className) {
    var classList = ele.classList;
    for (var i = 0; i < classList.length; i++) {
        if (classList[i] == className) {
            return true;
        }
    }
    return false;
}

// 移除元素的类
DataTable.prototype.removeClass = function (ele, className) {
    var classList = ele.classList;
    var newClassName = "";
    for (var i = 0; i < classList.length; i++) {
        if (classList[i] != className) {
            newClassName += classList[i];
        }
    }
    ele.className = newClassName;
}

// 根据tr的子节点，获取tr元素
DataTable.prototype.getTrEleByChildEle = function (childEle) {
    var parentEle = childEle.parentElement;
    while (parentEle != null) {
        if (parentEle.tagName == "TR") {
            return parentEle;
        }
        parentEle = parentEle.parentElement
    }
}

// 根据td的子节点，获取td元素
DataTable.prototype.getTdEleByChildEle = function (childEle) {
    var parentEle = childEle.parentElement;
    while (parentEle != null) {
        if (parentEle.tagName == "TD") {
            return parentEle;
        }
        parentEle = parentEle.parentElement
    }
}

// 返回table容器元素
DataTable.prototype.getContainerEle = function () {
    var that = this;
    var containerEle = document.getElementById(that.tableId);
    return containerEle;
}

// 返回table元素
DataTable.prototype.getTableEle = function () {
    var that = this;
    var tableId = "#" + that.tableId;
    var tableEle = document.querySelector(tableId + " .dt-table-content");
    return tableEle;
}

// 返回表格的数据：如果有定义gridData直接返回，否则后台获取的数据
DataTable.prototype.getGridData = function () {
    var that = this;
    if (that.options.gridData != null) {
        return that.options.gridData;
    } else {
        return that.options.remoteGridData;
    }
}

// 获取列只读情况
DataTable.prototype.getColReadonlyStr = function (column, rowData, isAdd) {
    // 行的值
    var colValue = "";
    if (rowData != null) {
        colValue = rowData[column.name];
    }

    // 只读设置
    var readonlyStr = "";
    var readonlyObj = isAdd ? column.add : column.edit;
    if (readonlyObj !== undefined && readonlyObj instanceof Function) {
        readonlyStr = readonlyObj(colValue, rowData) ? "" : ' readonly="readonly" ';
    } else if (readonlyObj !== undefined){
        readonlyStr = readonlyObj ? "" : ' readonly="readonly" ';
    }
    return readonlyStr;
}

// 初始化btn add, edit, cancel, save, del
DataTable.prototype.initTitleBtn = function (btnType) {
    var that = this;
    var htmlTemplate = '<button class="#className#"><i class="iconfont #iconName#"></i>#text#</button>';
    var className = "";
    var text = "";
    var iconName = "";
    switch (btnType) {
        case "add":
            className = that.tableVar.addRowBtnClass + ' dt-btn dt-btn-blue';
            iconName = 'icon-plus';
            text = "添加";
            break;
        case "edit":
            className = that.tableVar.editRowsBtnClass + ' dt-btn dt-btn-green';
            text = "编辑";
            iconName = 'icon-edit';
            break;
        case "del":
            className = that.tableVar.delRowsBtnClass + ' dt-btn dt-btn-red';
            text = "删除";
            iconName = 'icon-close';
            break;
        case "cancel":
            className = that.tableVar.cancelRowsBtnClass + ' dt-btn dt-btn-orange';
            text = "取消";
            iconName = 'icon-rotate-left';
            break;
        case "save":
            className = that.tableVar.saveRowsBtnClass + ' dt-btn dt-btn-default';
            text = "保存";
            iconName = 'icon-floppy-o';
            break;
    }
    var btnHtml = htmlTemplate.replace("#className#", className)
        .replace("#iconName#", iconName)
        .replace("#text#", text);
    return btnHtml;

}

DataTable.prototype.initTitleCustomBtn = function (btnObj, num) {
    var that = this;
    var htmlTemplate = '<button class="#className#" #data#><i class="iconfont #iconName#"></i>#text#</button>';
    // 自定义按钮：生成唯一的class
    var uniqueCustomBtnClass = that.tableVar.customBtnClass + num;
    var data = "data-num=" + num;
    var className = uniqueCustomBtnClass + " dt-btn " + btnObj.colorClass || "dt-btn-blue";
    var text = btnObj.text;
    var iconName = btnObj.icon;

    var btnHtml = htmlTemplate.replace("#className#", className)
        .replace("#data#", data)
        .replace("#iconName#", iconName)
        .replace("#text#", text);
    return btnHtml;
};

// 初始化table title
DataTable.prototype.initTitle = function () {
    var that = this;
    // 表格title
    var title = that.options.title || "";
    // 表格自定义工具栏
    var btnsHtml = "";
    var toolbarCustom = that.options.toolbarCustom;
    for (var i = 0; i < toolbarCustom.length; i++) {
        btnsHtml += that.initTitleCustomBtn(toolbarCustom[i], i);
    }

    // 表格常用工具栏：add, edit, cancel, save, del
    var toolbarItem = that.options.toolbarItem;
    var toolbarBtns = toolbarItem.split(",");
    for (var i = 0; i < toolbarBtns.length; i++) {
        btnsHtml += that.initTitleBtn(toolbarBtns[i].trim());
    }

    var titleTemplate = '<div class="dt-title">#title#</div>' +
        '<div class="dt-btn-group">#btnsHtml#</div>';
    var titleHtml = titleTemplate.replace("#title#", title)
        .replace("#btnsHtml#", btnsHtml);
    return titleHtml;
};

// 初始化table colgroup
DataTable.prototype.initColgroup = function () {
    var that = this;
    var columns = that.options.columns;
    var colgroupTemplate = "<colgroup>#cols#</colgroup>";
    var colTemplate = "<col style='#style#'>";
    var colHtml = "";
    for (var i = 0; i < columns.length; i++) {
        var colWidth = columns[i].width == null ? "" : "width:" + columns[i].width + "px;";
        var styleParam = colWidth;
        colHtml += colTemplate.replace("#style#", styleParam)
    }

    var colgroupHtml = colgroupTemplate.replace("#cols#", colHtml);
    return colgroupHtml;
};

// 初始化table tfoot属性
DataTable.prototype.initTfoot = function () {
    var tfootTemplate = '<tfoot>' +
        '<tr>' +
        '    <td>合计</td>' +
        '    <td>$180</td>' +
        '    <td>$180</td>' +
        '</tr>' +
        '</tfoot>';
    return tfootTemplate;
};

// 初始化table thead：columns的label属性
DataTable.prototype.initThead = function () {
    var that = this;
    var columns = that.options.realColumns;
    var theadTemplate = '<thead>#trs#</thead>';

    // 递归获得column的层级level
    // 参数 --> column：某一列的column对象；level：从0开始
    var getColumnLevel = function (column, level) {
        var childColumns = column["columns"];
        if (childColumns == null) {
            level++;
            return level;
        }

        ++level;
        var maxLevel = level;
        for (var i = 0; i < childColumns.length; i++) {
            var tempMaxLevel = getColumnLevel(childColumns[i], level);
            if (tempMaxLevel > maxLevel) {
                maxLevel = tempMaxLevel;
            }
        }
        return maxLevel;
    }

    // 获取columns层级：cols -> columns数组
    // 参数 --> cols：columns数组
    var getColumnsMaxLevel = function (cols) {
        var maxLevel = 1;
        for (var i = 0; i < cols.length; i++) {
            var temMaxLevel = getColumnLevel(cols[i], 0);
            if (temMaxLevel > maxLevel) {
                maxLevel = temMaxLevel;
            }
        }
        return maxLevel;
    }

    // 获得column的叶子节点数量
    // 参数 --> column：某一列的column对象
    var getColumnLeafCount = function (column) {
        var leafCount = 0;
        var childColumns = column["columns"];
        if (childColumns != null) {
            // 存在子节点，合计各个子节点的叶子节点数量
            for (var i = 0; i < childColumns.length; i++) {
                leafCount += getColumnLeafCount(childColumns[i]);
            }
        } else {
            // 没有子节点，返回1
            leafCount = 1;
        }
        return leafCount;
    }

    // 多级表头转为一级表头：递归遍历叶子节点
    // 参数 --> columns：表头每一行的columns数组
    var getTheadTrHtml = function (columns) {
        // 表头行模版
        var theadTrTemplate = '<tr>#ths#</tr>';
        // 表头列模版
        var theadThTemplate = '<th class="dt-breakWord" #rowspan# #colspan# #style#>' +
            '<div class="flex">' +
            '   <div class="flex flex-1 flex-pack-center flex-align-center ">#th#</div>' +
            '   <div class="flex flex-direction-column">#operate#</div>' +
            '</div>' +
            '</th>';
        var thsHtml = "";
        for (var i = 0; i < columns.length; i++) {
            // -------- 跨行、跨列 start --------
            var colspan = "";
            var rowspan = "";
            var column = columns[i];
            if (column["columns"] == null) {
                rowspan = 'rowspan="' + getColumnsMaxLevel(columns) + '"';
                colspan = "";
            } else {
                rowspan = "";
                colspan = 'colspan="' + getColumnLeafCount(column) + '"';
            }
            // -------- 跨行、跨列 end --------
            // -------- 表头style属性 start --------
            var styleHtml = "";
            var styleHtmlTemplate = ' style="#styleContent#"';
            /*
             * 表头固定居中，不跟随column
            if (column.align != null) {
                styleHtml += "text-align:" + column.align + ";";
            } else {
                // 表头默认居中
                styleHtml += "text-align: center;";
            }
            */
            styleHtml = styleHtmlTemplate.replace("#styleContent#", styleHtml);
            // -------- 表头style属性 end --------
            // -------- 排序 start --------
            var operateHtml = "";
            if (column.sort) {
                operateHtml += '<i data-name="' + column.name + '" class="dt-thead-sort iconfont icon-sort-asc"></i>' +
                    '<i data-name="' + column.name + '" class="dt-thead-sort iconfont icon-sort-desc"></i>';
            }
            // -------- 排序 end --------
            thsHtml += theadThTemplate
                .replace("#th#", column.label)
                .replace("#rowspan#", rowspan)
                .replace("#colspan#", colspan)
                .replace("#style#", styleHtml)
                .replace("#operate#", operateHtml);
        }
        thsHtml = theadTrTemplate.replace("#ths#", thsHtml);
        return thsHtml;
    }

    // 递归获得指定层级的columns：columns拆分成每个tr的columns
    // 参数 --> columns：columns数组；needLevel：所需要的层级；curLevel：当前层级，从0开始；returnColumn：当前返回数组
    var getTheadLevelColumns = function (columns, needLevel, curLevel, returnColumn) {
        if (columns == null) {
            return [];
        }
        if (needLevel == curLevel) {
            return columns;
        }
        curLevel++;
        for (var i = 0; i < columns.length; i++) {
            returnColumn = returnColumn.concat(getTheadLevelColumns(columns[i]["columns"], needLevel, curLevel, returnColumn));
        }
        return returnColumn;
    }
    // ---- for循环获取thead的每行<tr>内容 -----
    var maxLevel = getColumnsMaxLevel(columns);
    var theadTrsHtml = "";
    for (var i = 0; i < maxLevel; i++) {
        var levelColumns = getTheadLevelColumns(columns, i, 0, []);
        theadTrsHtml += getTheadTrHtml(levelColumns);
    }
    // ---- for循环获取thead的每行<tr>内容 -----

    var theadHtml = theadTemplate.replace("#trs#", theadTrsHtml);
    return theadHtml;
}

// td text输入框赋值
DataTable.prototype.initTdTextData = function (rowData, trEle, column) {
    var name = column.name;
    var tdInput = trEle.querySelector("input[name='" + name + "']");
    tdInput.value = rowData[name];
}

// td select下拉框赋值
DataTable.prototype.initTdSelectData = function (rowData, trEle, column) {
    var name = column.name;
    var tdSelect = trEle.querySelector("select[name='" + name + "']");
    var selectOpts = tdSelect.options;
    var selectValue = rowData[name];
    for (var i = 0; i < selectOpts.length; i++) {
        var opt = selectOpts[i];
        if (opt.value == selectValue) {
            opt.selected = true;
            return;
        }
    }
}

// td date日期赋值
DataTable.prototype.initTdDateData = function (rowData, trEle, column) {
    var that = this;
    var name = column.name;
    var dateInput = trEle.querySelector("input[name='" + name + "']");
    if (dateInput.readOnly) {
        return;
    }
    //执行一个laydate实例
    laydate.render({
        elem: '#' + dateInput.id,
        value: rowData[name],
        type: column.dateType,
        format: column.format,
        done: function (value, date, endDate) {
            // tr 编辑标识
            var currentTarget = dateInput;
            var trEle = that.getTrEleByChildEle(currentTarget);
            trEle.classList.add(that.tableVar.editRowClass);

            // gridData值修改
            var dataIndex = trEle.dataset.gridrowindex;
            that.getGridData()[dataIndex][currentTarget.name] = value;
        }
    });
}

// td date日期赋值
DataTable.prototype.initAddTdDateData = function (trEle) {
    var that = this;

    var columns = that.options.columns;
    for (var i = 0; i < columns.length; i++) {
        if (columns[i].type != "date") {
            continue;
        }

        var name = columns[i].name;
        var dateInput = trEle.querySelector("input[name='" + name + "']");
        if (dateInput.readOnly) {
            continue;
        }
        //执行一个laydate实例
        laydate.render({
            elem: '#' + dateInput.id,
            value: '',
            type: columns[i].dateType,
            format: columns[i].format,
            done: function (value, date, endDate) {
                // // tr 编辑标识
                // var currentTarget = dateInput;
                // var trEle = that.getTrEleByChildEle(currentTarget);
                // trEle.classList.add(that.tableVar.editRowClass);
                //
                // // gridData值修改
                // var dataIndex = trEle.dataset.gridrowindex;
                // that.getGridData()[dataIndex][currentTarget.name] = value;
            }
        });
    }


}

// td select只读赋值
DataTable.prototype.initReadOnlyTdSelectData = function (rowData, column) {
    var value = rowData[column.name];

    var items = column.items;
    for (var i = 0; i < items.length; i++) {
        for (var key in items[i]) {
            if (key == value) {
                return items[i][key];
            }
        }
    }

}

// tr数据赋值
DataTable.prototype.initTrData = function (rowData, trEle) {
    var that = this;
    var columns = that.options.columns;
    for (var i = 0; i < columns.length; i++) {
        var column = columns[i];

        switch (column.type) {
            case "text" :
                that.initTdTextData(rowData, trEle, column);
                break;
            case "select" :
                that.initTdSelectData(rowData, trEle, column);
                break;
            case "date" :
                that.initTdDateData(rowData, trEle, column);
                break;
            case "lineNum" : // 行号

                break;
            case "checkbox" : // 行checkbox
                break;
            default:

        }
    }
}

// tr添加行默认数据
DataTable.prototype.initAddTrData = function (trEle) {
    var that = this;
    var columns = that.options.columns;
    for (var i = 0; i < columns.length; i++) {
        var column = columns[i];
        switch (column.type) {
            case "date" :
                that.initAddTdDateData(trEle);
                break;
            default:

        }
    }
}

// td input text
DataTable.prototype.initTdText = function (column, rowData, isAdd) {
    var that = this;
    // 只读设置
    var readonly = that.getColReadonlyStr(column, rowData, isAdd);

    var textTemplate = '<input type="text" name="#name#" class="dt-td-text dt-td-text-readonly" #readonly#>';
    var textHtml = textTemplate.replace("#name#", column.name)
        .replace("#readonly#", readonly);
    return textHtml;
}

// td select
DataTable.prototype.initTdSelect = function (column, rowData, isAdd) {
    var that = this;
    // 只读设置
    var readonlyStr = that.getColReadonlyStr(column, rowData, isAdd);
    var disabledStr = readonlyStr == "" ? "" : ' disabled="disabled" ';

    var selectTemplate = '<select class="dt-td-select" name="#name#" #disabled#>#options#</select>';
    var optionTemplate = '<option value="#value#">#text#</option>';
    var items = column.items;
    var optionHtml = "";
    for (var i = 0; i < items.length; i++) {
        for (var key in items[i]) {
            optionHtml += optionTemplate.replace("#text#", items[i][key]).replace("#value#", key)
        }
    }
    var textHtml = selectTemplate.replace("#name#", column.name)
        .replace("#disabled#", disabledStr)
        .replace("#options#", optionHtml);
    return textHtml;
}

// td date
DataTable.prototype.initTdDate = function (column, rowData, isAdd) {
    var that = this;
    var name = column.name;
    var id = "";
    if (rowData == null) {
        // 增加行
        id = name + "Id_" + new Date().getTime();
    } else {
        // 编辑行
        id = name + "Id_" + rowData["gridRowIndex"];
    }

    // 只读设置
    var readonly = that.getColReadonlyStr(column, rowData, isAdd);

    var textTemplate = '<input id="#id#" type="text" name="#name#" class="dt-td-date" #readonly#>';
    var textHtml = textTemplate.replace("#name#", name)
        .replace("#id#", id)
        .replace("#readonly#", readonly);
    return textHtml;
}

// 初始化tbody tr的td 添加行
DataTable.prototype.initTbodyAddTd = function (column) {
    var that = this;
    var tdTemplate = '<td class="#class#">#td#</td>';
    var tdContentHtml = "";
    switch (column.type) {
        case "text" :
            tdContentHtml = that.initTdText(column, null, true);
            break;
        case "select" :
            tdContentHtml = that.initTdSelect(column, null, true);
            break;
        case "date" :
            tdContentHtml = that.initTdDate(column, null, true);
            break;
        case "lineNum" : // 行号
            tdContentHtml = 0;
            break;
        case "checkbox" : // 行checkbox
            // 每行checkboxName
            var checkboxClass = that.tableVar.selectRowCheckboxClass;
            tdContentHtml = '<input type="checkbox" class="' + checkboxClass + '">';
            break;
        default:
        // 渲染处理
        // if (column.render != null) {
        //     tdContentHtml = column.render(rowData[column.name], rowData);
        // } else {
        //     tdContentHtml = rowData[column.name];
        // }
    }

    var tdHtml = tdTemplate.replace("#td#", tdContentHtml)
        .replace("#class#", that.tableStyle.tdBaseClass);
    return tdHtml;
}

// 初始化tbody tr的td
DataTable.prototype.initTbodyEditTd = function (rowData, column, trEle) {
    var that = this;
    var tdTemplate = '<td class="#class#">#td#</td>';
    var tdContentHtml = "";
    switch (column.type) {
        case "text" :
            tdContentHtml = that.initTdText(column, rowData, false);
            break;
        case "select" :
            tdContentHtml = that.initTdSelect(column, rowData, false);
            break;
        case "date" :
            tdContentHtml = that.initTdDate(column, rowData, false);
            break;
        case "lineNum" : // 行号
            tdContentHtml = rowData["gridRowIndex"] + 1;
            break;
        case "checkbox" : // 行checkbox
            // 每行checkboxName
            var checkboxClass = that.tableVar.selectRowCheckboxClass;
            console.log(trEle);
            var checkStatus = "";
            if (that.hasClass(trEle, that.tableVar.selectedRowClass)) {
                checkStatus = "checked";
            }
            tdContentHtml = '<input type="checkbox" class="' + checkboxClass + '" ' + checkStatus + '>';
            break;
        default:
            // 渲染处理
            if (column.render != null) {
                tdContentHtml = column.render(rowData[column.name], rowData);
            } else {
                tdContentHtml = rowData[column.name];
            }
    }

    var tdHtml = tdTemplate.replace("#td#", tdContentHtml)
        .replace("#class#", that.tableStyle.tdBaseClass);
    return tdHtml;
}


// 初始化tbody tr的td
DataTable.prototype.initTbodyReadOnlyTd = function (rowData, column) {
    var that = this;
    var tdTemplate = '<td class="#class#">#td#</td>';
    var tdContentHtml = "";
    var classHtml = that.tableStyle.tdBaseClass;

    // ---- 对齐 ----
    if (column.align == "left") {
        classHtml += " dt-td-left ";
    } else if (column.align == "right") {
        classHtml += " dt-td-right ";
    } else {
        classHtml += " dt-td-center ";
    }
    // ---- 对齐 ----

    switch (column.type) {
        case "select" :
            tdContentHtml = that.initReadOnlyTdSelectData(rowData, column);
            break;
        case "lineNum" : // 行号
            tdContentHtml = rowData["gridRowIndex"] + 1;
            break;
        case "checkbox" : // 行checkbox
            // 每行checkboxName
            var checkboxClass = that.tableVar.selectRowCheckboxClass;
            tdContentHtml = '<input type="checkbox" class="' + checkboxClass + '">';
            break;
        case "treeFold" : // 行checkbox
            var treeClassName = that.tableVar.openRowClass;
            var prefixStr = "";
            var rowTreeLevel = rowData["treeLevel"];
            for (var i = 0; i < rowTreeLevel; i++) {
                prefixStr += '<div class="dt-tree-box-half">&nbsp;</div>';
                if (i == (rowTreeLevel - 1)) {
                    prefixStr += '<div class="dt-tree-box"><i class="iconfont icon-zuoxiajiao"></i></div>';
                } else {
                    prefixStr += '<div class="dt-tree-box">&nbsp;</div>';
                }
            }
            if (rowData["isTreeLeaf"]) {
                prefixStr += '<div class="dt-tree-box"><i class="iconfont icon-file"></i></div>';
            } else {
                prefixStr += '<div class="dt-tree-box"><i class="' + treeClassName + ' iconfont icon-minus-square-o"></i></div>';
            }
            tdContentHtml = '<div class="dt-tree-row" data-treelevel="' + rowTreeLevel + '">' + prefixStr + '</div>';
            break;
        default:
            // 渲染处理
            if (column.render != null) {
                tdContentHtml = column.render(rowData[column.name], rowData);
            } else {
                tdContentHtml = rowData[column.name];
            }
    }


    var tdHtml = tdTemplate.replace("#td#", tdContentHtml)
        .replace("#class#", classHtml);
    return tdHtml;
}

// 初始化tbody 添加tr 不带tr标签
DataTable.prototype.initTbodyAddTr = function () {
    var that = this;
    var columns = that.options.columns;
    var tdsHtml = "";
    for (var j = 0; j < columns.length; j++) {
        tdsHtml += that.initTbodyAddTd(columns[j]);
    }
    return tdsHtml;
}

// 编辑tr 文本框编辑change事件
DataTable.prototype.tdTextChangeFn = function (colEle) {
    var that = this;
    that.addEventListener(colEle, "onchange", function (e) {
        // tr 编辑标识
        var currentTarget = e.currentTarget;
        var trEle = that.getTrEleByChildEle(currentTarget);
        trEle.classList.add(that.tableVar.editRowClass);

        // gridData值修改
        var dataIndex = trEle.dataset.gridrowindex;
        that.getGridData()[dataIndex][currentTarget.name] = currentTarget.value;
    });
}

// 编辑tr 下拉框编辑change事件
DataTable.prototype.tdSelectChangeFn = function (colEle) {
    var that = this;
    that.addEventListener(colEle, "onchange", function (e) {
        var currentTarget = e.currentTarget;
        // tr 编辑标识
        var trEle = that.getTrEleByChildEle(currentTarget);
        trEle.classList.add(that.tableVar.editRowClass);


        // gridData值修改
        var selectedIndex = currentTarget.selectedIndex;
        var selectValue = currentTarget.options[selectedIndex].value;
        var dataIndex = trEle.dataset.gridrowindex;
        that.getGridData()[dataIndex][currentTarget.name] = selectValue;
    });
}

// 编辑tr change事件监听
DataTable.prototype.initTbodyEditTrChangeEvent = function (trEle) {
    var that = this;
    var columns = that.options.columns;
    for (var i = 0; i < columns.length; i++) {
        var column = columns[i];
        var colEle = null;
        switch (column.type) {
            case "text":
                colEle = trEle.querySelector("input[name='" + column.name + "']");
                that.tdTextChangeFn(colEle);
                break;
            case "select":
                colEle = trEle.querySelector("select[name='" + column.name + "']");
                that.tdSelectChangeFn(colEle);
                break;
            case "date":
                // 日期change事件在初始化时定义
                break;
        }

    }

}

// 初始化tbody 编辑tr 不带tr标签
DataTable.prototype.initTbodyEditTr = function (rowData, trEle) {
    var that = this;
    var tdsHtml = "";
    var columns = that.options.columns;
    for (var j = 0; j < columns.length; j++) {
        tdsHtml += that.initTbodyEditTd(rowData, columns[j], trEle);
    }
    return tdsHtml;
}

// 初始化tbody tr
DataTable.prototype.initTbodyReadOnlyTr = function (rowData) {
    var that = this;
    var columns = that.options.columns;
    var trTemplate = "<tr data-gridrowindex='#gridRowIndex#' #style#>#tds#</tr>"
    // style
    var styleHtml = "";
    if (that.options.trStyle instanceof Function) {
        styleHtml = "style='" + that.options.trStyle(rowData) + "'";
    }
    // td
    var tdsHtml = "";
    for (var j = 0; j < columns.length; j++) {
        tdsHtml += that.initTbodyReadOnlyTd(rowData, columns[j]);
    }
    var trHtml = trTemplate.replace("#tds#", tdsHtml)
        .replace("#gridRowIndex#", rowData["gridRowIndex"])
        .replace("#style#", styleHtml);
    return trHtml;
}

// 按照tree排序
DataTable.prototype.sortGridDataByTree = function (gridData) {
    var that = this;
    var treeOptions = that.options.treeOptions;
    if (treeOptions == null) {
        return gridData;
    }
    var parentKey = treeOptions.parentKey;
    var pkKey = treeOptions.key;
    var treeLevel = 0;
    var newGridData = [];
    // 获取一级节点：parentKey为空；parentKey的值找不到父节点；
    for (var i = 0; i < gridData.length; i++) {
        var gridRow = gridData[i];
        var gridRowParentKey = gridRow[parentKey];
        if (!gridRowParentKey) {
            gridRow["treeLevel"] = treeLevel;
            newGridData.push(gridRow);
        } else {
            var hasParent = false;
            for (var j = 0; j < gridData.length; j++) {
                if (gridRowParentKey == gridData[j][pkKey]) {
                    hasParent = true;
                    break;
                }
            }
            if (!hasParent) {
                gridRow["treeLevel"] = treeLevel;
                newGridData.push(gridRow);
            }
            hasParent = false;
        }
    }

    while (newGridData.length < gridData.length && treeLevel < 100) {
        var childLevelData = [];
        for (var i = 0; i < newGridData.length; i++) {
            childLevelData.push(newGridData[i]);
            // 获取当前节点的子节点
            if (newGridData[i]["treeLevel"] == treeLevel) {
                for (var j = 0; j < gridData.length; j++) {
                    var gridRow = gridData[j];
                    if (newGridData[i][pkKey] == gridRow[parentKey]) {
                        gridRow["treeLevel"] = treeLevel + 1;
                        childLevelData.push(gridRow)
                    }
                }
            }
        }
        newGridData = childLevelData;
        treeLevel++;
    }

    // ----- 叶子节点判断 start -----
    var maxLevel = 0;
    for (var i = 0; i < newGridData.length; i++) {
        var hasChild = false;
        for (var j = 0; j < newGridData.length; j++) {
            if (newGridData[i][pkKey] == newGridData[j][parentKey]) {
                hasChild = true;
                break;
            }
        }


        newGridData[i]["isTreeLeaf"] = !hasChild;
        hasChild = false;
    }

    // ----- 叶子节点判断 end -----
    console.log(newGridData);
    return newGridData;
}

// 初始化table tbody
DataTable.prototype.doInitTbody = function (gridData) {
    var that = this;

    // 按照tree排序
    gridData = that.sortGridDataByTree(gridData);

    var pageCurrent = that.options.paging.pageCurrent;
    var pageSize = that.options.paging.pageSize;
    // 从1开始
    var startNum = (pageCurrent - 1) * pageSize + 1;
    // 从2开始
    var endNum = startNum + pageSize - 1;

    var oldGridData = [];
    var trsHtml = "";
    for (var i = 0; i < gridData.length; i++) {
        var rowData = gridData[i];
        // 设定唯一行数据索引
        rowData["gridRowIndex"] = i;


        oldGridData.push(JSON.parse(JSON.stringify(rowData)));

        // 分页处理
        if ((i + 1) >= startNum && (i + 1) <= endNum) {
            trsHtml += that.initTbodyReadOnlyTr(rowData);
        }
    }
    // 保存初始化表格的数据
    that.options.oldGridData = oldGridData;

    var tbodyEle = that.getTableEle().querySelector("tbody");
    tbodyEle.innerHTML = trsHtml;

    // 设置分页信息
    that.initPagingData();

    // 初始化表格监听事件
    that.initGridEvent();

    // ------ 表格渲染完成回调 start ------
    if (that.options.afterLoad instanceof Function) {
        // 请求数据前回调方法
        if (!that.options.afterLoad(gridData)) {
            return;
        }
    }
    // ------ 表格渲染完成回调 end ------

}

// 初始化table tbody
DataTable.prototype.initTbody = function () {
    var that = this;

    var gridData = that.options.gridData;

    // gridData优先级大于dataUrl
    if (gridData != null) {
        that.doInitTbody(gridData);
        return;
    }

    // ----- 后台获取gridData数据并初始化tbody start -----
    if (gridData == null) {
        if (that.options.dataUrl == null) {
            console.log("未定义表格dataUrl属性");
            return;
        }

        // post到后台的参数
        var postDataObj = {};
        // ----- postData请求数据参数 start -----
        var postData = that.options.postData;
        if (postData instanceof Object) {
            postDataObj = postData;
        }
        if (postData instanceof Function) {
            postDataObj = postData();
        }
        // ----- postData请求数据参数 end -----

        // ----- 后台分页:【pageSize pageCurrent】 start -----
        if (that.options.local == "remote") {
            // 远程分页
            postDataObj.pageSize = that.options.paging.pageSize;
            postDataObj.pageCurrent = that.options.paging.pageCurrent;
        }
        // ----- 后台分页:【pageSize pageCurrent】 end -----

        // ----- 请求数据前回调方法 start -----
        if (that.options.beforeGetData instanceof Function) {
            if (!that.options.beforeGetData(postDataObj)) {
                console.log("beforeGetData 取消请求数据");
                return
            }
        }
        // ----- 请求数据前回调方法 end -----

        that.doAjax({
            type: "POST",
            url: that.options.dataUrl,
            data: postDataObj,
            success: function (res) {
                console.log("表格数据获取成功");
                // ------ 数据前缀处理 start ------
                var dataPrefixs = that.options.dataPrefix.split(".");
                var temRes = res;
                for (var i = 0; i < dataPrefixs.length; i++) {
                    temRes = temRes[dataPrefixs[i]]
                }
                // 设定表格的值
                that.options.remoteGridData = temRes;
                // 分页处理
                // that.options.paging.pageCurrent = parseInt(res.data.pageCurrent);
                that.options.paging.totalRow = parseInt(res.data.totalRow);
                // ------ 数据前缀处理 end ------

                // ------ 数据加载完成回调 start ------
                if (that.options.afterGetData instanceof Function) {
                    // 请求数据前回调方法
                    if (!that.options.afterGetData(temRes)) {
                        return;
                    }
                }
                // ------ 数据加载完成回调 end ------
                that.doInitTbody(temRes);
            },
            error: function () {
                console.log("请求表格数据 error")
            }
        });
    }
    // ----- 后台获取gridData数据并初始化tbody end -----
}

// 跳转到某一页
DataTable.prototype.goPage = function (pageNum) {
    var that = this;
    pageNum = parseInt(pageNum);
    // ----- 跳转超出最大页，设为最大页 start -----
    var pagingObj = that.options.paging;
    var totalRow = pagingObj.totalRow;
    var pageSize = pagingObj.pageSize;
    var totalPage = Math.ceil(totalRow / pageSize)
    if (pageNum >= totalPage) {
        pageNum = totalPage;
    }
    // ----- 跳转超出最大页，设为最大页 end -----

    that.options.paging.pageCurrent = pageNum;
    var gridData = that.options.gridData || that.options.remoteGridData;
    // 重新初始化tbody
    that.doInitTbody(gridData);
}

// 初始化分页数据
DataTable.prototype.initPagingData = function () {
    var that = this;
    var pagingObj = that.options.paging;
    // 表格数据
    var gridData = that.options.gridData || that.options.remoteGridData;

    // 本地分页
    if (that.options.local == "local") {
        pagingObj.totalRow = gridData.length;
    }

    var totalRow = pagingObj.totalRow;
    var pageSize = pagingObj.pageSize;
    var pageCurrent = pagingObj.pageCurrent;
    var showPageNum = pagingObj.showPageNum;
    var halfShowPagenum = parseInt(showPageNum / 2);
    var totalPage = Math.ceil(totalRow / pageSize); // 总页数 = 总行数 / 默认每页行数

    // 分页容器
    var pagingContainer = document.getElementsByClassName(that.tableVar.pagingContainerClass)[0];
    // 总记录数/总页数 设定
    pagingContainer.getElementsByClassName("dt-paging-total")[0].innerHTML = totalRow + '/' + totalPage;

    // 分页开始行
    var startNum = 1;
    // 分页结束行
    var endNum = 1;

    // 总页数 <= 展示页数
    if (totalPage <= showPageNum) {
        startNum = 1;
        endNum = totalPage;
    }
    // 总页数 > 展示页数
    if (totalPage > showPageNum) {
        if ((pageCurrent + halfShowPagenum) >= totalPage) {
            // 当前页不可以在中间
            endNum = totalPage;
        } else {
            // 当前页可以在中间
            endNum = pageCurrent + halfShowPagenum;
            // 开始最小是1 -> showPageNum不会大于endNum(上方已经校验)
            endNum = endNum <= showPageNum ? showPageNum : endNum;
        }
        startNum = endNum - showPageNum + 1;
    }

    // 分页页码显示html
    var showPageNumHtml = '';
    for (var i = startNum; i <= endNum; i++) {
        showPageNumHtml += '<a class="dt-paging-num" data-num="' + i + '">' + i + '</a>';
    }
    pagingContainer.getElementsByClassName("dt-paging-nums")[0].innerHTML = showPageNumHtml;

    // ------ 当前页处理：数字背景、输入框值修改 start ------
    var pageNums = pagingContainer.getElementsByClassName("dt-paging-num");
    for (var i = 0; i < pageNums.length; i++) {
        if (parseInt(pageNums[i].dataset.num) == pageCurrent) {
            // 数字背景修改
            pageNums[i].classList.add("dt-paging-select-num");
            // 输入框修改
            pagingContainer.getElementsByClassName("dt-paging-go")[0].value = pageCurrent;
            break;
        }
    }

    // ------ 当前页处理：数字背景、输入框值修改 end ------

    // ------ 分页首页、上一页、下一页、尾页 失效处理 start ------
    var disableClassName = "dt-paging-a-disabled";
    var firstPageEle = pagingContainer.getElementsByClassName("dt-paging-first-page")[0];
    var prePageEle = pagingContainer.getElementsByClassName("dt-paging-pre-page")[0];
    var lastPageEle = pagingContainer.getElementsByClassName("dt-paging-last-page")[0];
    var nextPageEle = pagingContainer.getElementsByClassName("dt-paging-next-page")[0];
    if (pageCurrent == 1) {
        firstPageEle.classList.add(disableClassName);
        prePageEle.classList.add(disableClassName);
    } else {
        that.removeClass(firstPageEle, disableClassName);
        that.removeClass(prePageEle, disableClassName);
    }
    if (pageCurrent == totalPage) {
        lastPageEle.classList.add(disableClassName);
        nextPageEle.classList.add(disableClassName);
    } else {
        that.removeClass(lastPageEle, disableClassName);
        that.removeClass(nextPageEle, disableClassName);
    }
    // ------ 分页首页、上一页、下一页、尾页 失效处理 end ------

    // 数据加载完成后式样调整
    that.doTableStyleAfterInitTbody();
    // 添加监听事件
    that.initGridEventAfterDataLoad();
}

// 初始化分页元素
DataTable.prototype.initPagingEle = function () {
    var that = this;
    var pagingObj = that.options.paging;
    var totalRow = pagingObj.totalRow;
    var pageSize = pagingObj.pageSize;
    var selectPageSize = pagingObj.selectPageSize;

    var pagingHtmlTemplate = '<div class="dt-paging-box">' +
        '<div class="dt-paging-page-size">' +
        '   <button class="dt-paging-refresh" title="刷新"><i class="iconfont icon-refresh"></i></button>' +
        '   <select class="dt-paging-select-pages">#pagingOptions#</select>' +
        '</div>' +
        '<div class="dt-paging-pages">' +
        '   <span class="dt-paging-total" title="总记录数/总页数">' + totalRow + '/' + (totalRow / pageSize) + '</span>' +
        '   <input class="dt-paging-go" title="请输入跳转页码" value="1">' +
        '   <div>' +
        '       <a class="dt-paging-first-page" title="首页"><i class="iconfont icon-step-backward"></i></a>' +
        '       <a class="dt-paging-pre-page" title="上一页"><i class="iconfont icon-backward"></i></a>' +
        '   </div>' +
        '   <div class="dt-paging-nums">' +
        '       <a class="dt-paging-num dt-paging-select-num">1</a>' +
        '   </div>' +
        '   <div>' +
        '       <a class="dt-paging-next-page" title="下一页" ><i class="iconfont icon-forward"></i></a>' +
        '       <a class="dt-paging-last-page" title="尾页" ><i class="iconfont icon-step-forward"></i></a>' +
        '   </div>' +
        '</div>' +
        '</div>';
    // 给分页下拉框赋值
    var pageSizeList = selectPageSize.split(",");
    var selectPageOptionsHtml = '';
    for (var i = 0; i < pageSizeList.length; i++) {
        // 默认选中分页大小
        var selectFlag = "";
        if (pageSize == pageSizeList[i]) {
            selectFlag = "selected";
        }
        selectPageOptionsHtml += '<option value="' + pageSizeList[i] + '" ' + selectFlag + '>' + pageSizeList[i] + '/页</option>';
    }

    return pagingHtmlTemplate.replace("#pagingOptions#", selectPageOptionsHtml);
}

// 设定表格容器式样
DataTable.prototype.doContainerStyle = function () {
    var that = this;
    var tableEle = that.getContainerEle();
    if (that.options['maxWidth']) {
        tableEle.style.maxWidth = that.options['maxWidth'] + "px";
        tableEle.style.overflow = "auto";
    }
}

DataTable.prototype.doTableCommonStyle = function () {
    var that = this;

    var styleHtml = "";
    // 所有td添加换行
    that.tableStyle.tdBaseClass += " dt-breakWord ";
    // 填满父容器
    if (that.options['fullGrid']) {
        styleHtml += "width: 100%;";
    }
    // 存在最大宽度，则宽度所有列宽的和
    if (that.options['maxWidth']) {
        var tableMaxWidth = 0;
        for (var i = 0; i < that.options.columns.length; i++) {
            tableMaxWidth += that.options.columns[i].width;
        }
        styleHtml += "width: " + tableMaxWidth + "px;";
        styleHtml += "table-layout: fixed;";
    }
    return styleHtml;
}

// 设定表格table thead 元素式样&子元素式样
DataTable.prototype.doTableTheadStyle = function () {
    var that = this;

    var styleHtml = that.doTableCommonStyle();
    return styleHtml;
}

// 设定表格table内容
DataTable.prototype.doTableContentStyle = function () {
    var that = this;

    var styleHtml = that.doTableCommonStyle();
    var contentSize = that.options['contentSize'];
    if (contentSize) {
        styleHtml += "font-size:" + contentSize + ";";
    }

    return styleHtml;
}

// 设定表格table tbody方式修改后式样
DataTable.prototype.doTableStyleAfterInitTbody = function () {
    var that = this;
    // -------------------------------------------------------------
    var containerEle = that.getContainerEle();
    containerEle.getElementsByClassName("dt-tbody-container")[0].onscroll = function () {
        var scrollLeft = containerEle.getElementsByClassName("dt-tbody-container")[0].scrollLeft;
        containerEle.getElementsByClassName("dt-thead-container")[0].scrollLeft = scrollLeft;
    }
    // -------------------------------------------------------------
}

// 通过行的子元素ele，获得这个行的ele
DataTable.prototype.getRowEleByChildNode = function (childEle) {
    var parenNode = childEle.parentNode;
    while (parenNode != null) {
        if (parenNode.tagName == "TR") {
            return parenNode;
        }
        parenNode = parenNode.parentNode;
    }
}

// 点选中行
// 参数 --> rows：td元素；selectedFlag：是否选中
DataTable.prototype.selectedRowsByRowEle = function (rows, selectedFlag) {
    var that = this;
    // 每行添加/删除 选中的class
    var selectRowClassName = that.tableVar.selectedRowClass;
    if (selectedFlag) {
        rows.classList.add(selectRowClassName);
    } else {
        rows.classList.remove(selectRowClassName)
    }
    // 每行对应的checkbox选中/取消选中
    var rowCheckbox = rows.querySelector("." + that.tableVar.selectRowCheckboxClass);
    if (rowCheckbox != null) {
        rowCheckbox.checked = selectedFlag;
    }
}

// 通过行的任何子节点选中行
// 参数 --> childEle：tr的任意子节点；selectedFlag：是否选中
DataTable.prototype.selectedRowsByChildNode = function (childEle, selectedFlag) {
    var that = this;
    var rowEle = that.getRowEleByChildNode(childEle);
    that.selectedRowsByRowEle(rowEle, selectedFlag);
}

// 获取已选中行 tr
DataTable.prototype.getSelectedTrs = function () {
    var that = this;
    // 根据选中行的class，获取选中行
    var trs = document.getElementById(that.tableId).getElementsByClassName(that.tableVar.selectedRowClass);
    return trs;
}

// 获取已选中行的数据
// 参数 --> 选中行的元素
DataTable.prototype.getSelectedTrDataByTrEle = function (trEle) {
    var that = this;
    var dataIndex = parseInt(trEle.dataset.gridrowindex);
    return that.getGridData()[dataIndex];
}

// 获取已选中行的数据
// 参数 --> 选中行的元素
DataTable.prototype.getSelectedTrDatas = function () {
    var that = this;

    var trEles = that.getSelectedTrs();

    var selectedRes = [];
    // 是否多个元素
    if (trEles instanceof HTMLCollection) {
        for (var i = 0; i < trEles.length; i++) {
            var dataIndex = parseInt(trEles[i].dataset.gridrowindex);
            selectedRes.push(that.getGridData()[dataIndex]);
        }
    } else {
        var dataIndex = parseInt(trEles.dataset.gridrowindex);
        selectedRes.push(that.getGridData()[dataIndex]);
    }
    return selectedRes;
}

// 根据tr的class 获取tr ele
DataTable.prototype.getTrsByTrClass = function (trClass) {
    var that = this;
    // 根据选中行的class，获取选中行
    var trs = document.getElementById(that.tableId).getElementsByClassName(trClass);
    // 为空返回[]
    trs = trs == null ? [] : trs;
    return trs;
}

// 获取新增行 tr ele
DataTable.prototype.getAddRowTrs = function () {
    var that = this;
    return that.getTrsByTrClass(that.tableVar.addRowClass);
}

// 获取编辑行 tr ele
DataTable.prototype.getEditRowTrs = function () {
    var that = this;
    return that.getTrsByTrClass(that.tableVar.editRowClass);
}

// 获取删除行 tr ele
DataTable.prototype.getDelRowTrs = function () {
    var that = this;
    return that.getTrsByTrClass(that.tableVar.delRowClass);
}

// 获取新增行数据
DataTable.prototype.getAddRowsData = function () {
    var that = this;
    // 获取添加行ele
    var addTrs = that.getAddRowTrs();
    var addList = [];
    var columns = that.options.columns;
    for (var i = 0; i < addTrs.length; i++) {
        var addTr = addTrs[i];
        var addObj = {};
        for (var j = 0; j < columns.length; j++) {
            var columnName = columns[j].name;
            // 未定义name直接返回
            if (columnName == null) {
                continue;
            }
            var columnValue = "";
            switch (columns[j].type) {
                // text和date相同
                case "text":
                case "date":
                    var inputEle = addTr.querySelector("input[name='" + columnName + "']");
                    columnValue = inputEle.value;
                    break;
                case "select":
                    var selectEle = addTr.querySelector("select[name='" + columnName + "']");
                    var selectedIndex = selectEle.selectedIndex;
                    columnValue = selectEle.options[selectedIndex].value;
                    break;
                default:
                    continue;
            }

            addObj[columnName] = columnValue;
        }
        addList.push(addObj);
    }
    return addList;
}

// 获取编辑行数据
DataTable.prototype.getEditRowsData = function () {
    var that = this;
    var editTrs = that.getEditRowTrs();
    var editList = [];
    var gridData = that.getGridData();

    // 多主键处理
    var editPKs = [];
    if (that.options.editPK != null) {
        editPKs = that.options.editPK.split(",");
    }

    for (var i = 0; i < editTrs.length; i++) {
        var dataIndex = parseInt(editTrs[i].dataset.gridrowindex);
        var editData = gridData[dataIndex];

        if (editPKs.length > 0) {
            var newEditData = {};
            for (var j = 0; j < editPKs.length; j++) {
                newEditData[editPKs[j]] = editData[editPKs[j]];
            }
            editList.push(newEditData);
        } else {
            editList.push(editData);
        }

    }
    return editList;
}

// 获取删除行数据
DataTable.prototype.getDelRowsData = function () {
    var that = this;
    // 表格数据
    var gridData = that.getGridData();
    // 删除数据ele
    var delTrs = that.getDelRowTrs();
    // 多主键处理
    var delPKs = [];
    if (that.options.delPK != null) {
        delPKs = that.options.delPK.split(",");
    }

    var delList = [];
    for (var i = 0; i < delTrs.length; i++) {
        var dataIndex = parseInt(delTrs[i].dataset.gridrowindex);
        var delData = gridData[dataIndex];

        if (delPKs.length > 0) {
            var newDelData = {};
            for (var j = 0; j < delPKs.length; j++) {
                newDelData[delPKs[j]] = delData[delPKs[j]];
            }
            delList.push(newDelData);
        } else {
            delList.push(delData);
        }
    }
    return delList;
}

// 添加行
DataTable.prototype.addRow = function () {
    var that = this;
    var addTrHtml = that.initTbodyAddTr();
    var tbody = that.getTableEle().querySelector("tbody");
    var tbodyFirstChild = that.getTableEle().querySelector("tbody tr");
    var newTr = document.createElement("tr");
    // class：添加行标识
    newTr.classList.add(that.tableVar.addRowClass);
    newTr.innerHTML = addTrHtml;
    tbody.insertBefore(newTr, tbodyFirstChild);
    // 初始化行数据赋值
    that.initAddTrData(newTr);
}

// 编辑行
DataTable.prototype.editRows = function (selectedTrs) {
    var that = this;
    if (selectedTrs == null) {
        console.log("请选中需要编辑的行");
        return;
    }

    // 是否多个元素
    if (selectedTrs instanceof HTMLCollection) {
        for (var i = 0; i < selectedTrs.length; i++) {
            var rowData = that.getSelectedTrDataByTrEle(selectedTrs[i]);
            selectedTrs[i].innerHTML = that.initTbodyEditTr(rowData, selectedTrs[i]);
            // 行编辑监听事件
            that.initTbodyEditTrChangeEvent(selectedTrs[i]);
            // 行数据赋值
            that.initTrData(rowData, selectedTrs[i]);
        }
    } else {
        var rowData = that.getSelectedTrDataByTrEle(selectedTr);
        selectedTrs.innerHTML = that.initTbodyEditTr(rowData, selectedTrs);
        // 行编辑监听事件
        that.initTbodyEditTrChangeEvent(selectedTr);
    }

    // 共通监听
    that.initGridEventAfterDataLoad();
}

// 删除行
DataTable.prototype.delRows = function (selectedTrs) {
    var that = this;
    if (selectedTrs == null) {
        console.log("请选中需要删除的行");
        return;
    }

    // 是否多个元素
    if (selectedTrs instanceof HTMLCollection) {
        for (var i = 0; i < selectedTrs.length; i++) {
            // class：删除行class
            selectedTrs[i].classList.add(that.tableVar.delRowClass);
        }
    } else {
        // class：删除行class
        selectedTrs.classList.add(that.tableVar.delRowClass);
    }
}

// 取消编辑行
DataTable.prototype.cancelRows = function (selectedTrs) {
    if (selectedTrs == null) {
        console.log("请选中需要取消的行");
        return;
    }

    // 是否多个元素
    if (selectedTrs instanceof HTMLCollection) {
        for (var i = 0; i < selectedTrs.length; i++) {
            selectedTrs[i].style.display = "none";
            selectedTrs[i].setAttribute("data-isDel", "1");
        }
    } else {
        selectedTrs.style.display = "none";
        selectedTrs.setAttribute("data-isDel", "1");
    }
}

// 保存行
DataTable.prototype.saveRows = function () {
    var that = this;

    // post到后台的参数
    var postDataObj = {};
    // ----- savePostData额外参数 start -----
    var savePostData = that.options.savePostData;
    if (savePostData instanceof Object) {
        postDataObj = savePostData;
    }
    if (savePostData instanceof Function) {
        postDataObj = savePostData();
    }
    // ----- savePostData额外参数 end -----

    var addRowsJson = JSON.stringify(that.getAddRowsData());
    var editRowsJson = JSON.stringify(that.getEditRowsData());
    var delListJson = JSON.stringify(that.getDelRowsData());
    postDataObj[that.tableVar.resAddList] = addRowsJson;
    postDataObj[that.tableVar.resEditList] = editRowsJson;
    postDataObj[that.tableVar.resDelList] = delListJson;

    if (addRowsJson == "[]" && editRowsJson == "[]" && delListJson == "[]") {
        console.log("没有需要保存的数据")
        return;
    }

    if (that.options.beforeSave instanceof Function) {
        // 保存前执行：返回false保存终止
        if (!that.options.beforeSave(postDataObj)) {
            console.log("beforesave 取消保存");
            return
        }
    }

    that.doAjax({
        type: "POST",
        url: that.options.saveUrl,
        data: postDataObj,
        success: function (res) {
            console.log("数据保存成功")
            console.log(res)
            if (that.options.afterSave instanceof Function) {
                // 保存成功回调方法
                that.options.afterSave(res);
            }
        },
        error: function () {
            console.log("error")
        }
    });
    console.log(postDataObj);
}


// 初始化表格监听事件
DataTable.prototype.initGridEvent = function () {
    var that = this;
    // ------- 选中所有行监听 start -------
    if (that.options.showCheckboxCol) {
        // 表头选中行监听
        that.addEventListener(document.getElementById(that.tableVar.selectAllRowsCheckboxId), "click", function (e) {
            var isChecked = e.currentTarget.checked;
            var rowCheckboxEles = document.getElementsByClassName(that.tableVar.selectRowCheckboxClass);
            for (var i = 0; i < rowCheckboxEles.length; i++) {
                that.selectedRowsByChildNode(rowCheckboxEles[i], isChecked)
            }
        });

    }
    // ------- 选中所有行监听 end -------
    // ------- 工具栏监听 start -------
    // 添加行按钮监听
    that.addEventListener(document.getElementsByClassName(that.tableVar.addRowBtnClass), "click", function (e) {
        that.addRow();
    });
    // 编辑行按钮监听
    that.addEventListener(document.getElementsByClassName(that.tableVar.editRowsBtnClass), "click", function (e) {
        var selectedTrs = that.getSelectedTrs();
        that.editRows(selectedTrs);
    });
    // 删除行按钮监听
    that.addEventListener(document.getElementsByClassName(that.tableVar.delRowsBtnClass), "click", function (e) {
        var selectedTrs = that.getSelectedTrs();
        that.delRows(selectedTrs);
    });
    // 取消行按钮监听
    that.addEventListener(document.getElementsByClassName(that.tableVar.cancelRowsBtnClass), "click", function (e) {
        // 数据还原：编辑后数据会修改
        if (that.options.local == "remote") {
            that.options.remoteGridData = that.options.oldGridData;
        } else {
            that.options.gridData = that.options.oldGridData;
        }
        // 取消表格编辑
        that.doInitTbody(that.options.oldGridData);
    });
    // 保存行按钮监听
    that.addEventListener(document.getElementsByClassName(that.tableVar.saveRowsBtnClass), "click", function (e) {
        that.saveRows();
    });
    // ------- 工具栏监听 end -------
    // ------- 自定义工具栏监听 start -------
    var toolbarCustom = that.options.toolbarCustom;
    for (var i = 0; i < toolbarCustom.length; i++) {
        var customClassName = that.tableVar.customBtnClass + i;
        // 自定义按钮监听
        that.addEventListener(document.getElementsByClassName(customClassName), "click", function (e) {
            // toolbarCustom[i].fn(that);
            that.options.toolbarCustom[e.currentTarget.dataset.num].fn(that);
        });
    }
    // ------- 自定义工具栏监听 end -------
    // ------- 分页栏监听 end -------
    // 分页容器
    var pagingContainer = document.getElementsByClassName(that.tableVar.pagingContainerClass)[0];

    // 分页数字按钮监听
    that.addEventListener(pagingContainer.getElementsByClassName("dt-paging-num"), "click", function (e) {
        that.goPage(e.currentTarget.dataset.num)
    });
    // 首页按钮监听
    that.addEventListener(pagingContainer.getElementsByClassName("dt-paging-first-page"), "click", function (e) {
        // 连接失效直接返回
        if (that.hasClass(e.currentTarget, "dt-paging-a-disabled")) {
            return;
        }
        that.goPage(1);
    });
    // 上一页按钮监听
    that.addEventListener(pagingContainer.getElementsByClassName("dt-paging-pre-page"), "click", function (e) {
        // 连接失效直接返回
        if (that.hasClass(e.currentTarget, "dt-paging-a-disabled")) {
            return;
        }
        var num = that.options.paging.pageCurrent - 1;
        that.goPage(num)
    });
    // 下一页按钮监听
    that.addEventListener(pagingContainer.getElementsByClassName("dt-paging-next-page"), "click", function (e) {
        // 连接失效直接返回
        if (that.hasClass(e.currentTarget, "dt-paging-a-disabled")) {
            return;
        }
        var num = that.options.paging.pageCurrent + 1;
        that.goPage(num)
    });
    // 尾按钮监听
    that.addEventListener(pagingContainer.getElementsByClassName("dt-paging-last-page"), "click", function (e) {
        // 连接失效直接返回
        if (that.hasClass(e.currentTarget, "dt-paging-a-disabled")) {
            return;
        }
        var paging = that.options.paging;
        var totalPage = Math.ceil(paging.totalRow / paging.pageSize);
        that.goPage(totalPage)
    });
    // 跳转页change事件
    that.addEventListener(pagingContainer.getElementsByClassName("dt-paging-go"), "onchange", function (e) {
        that.goPage(e.currentTarget.value);
    });
    // 页数select change事件
    that.addEventListener(pagingContainer.getElementsByClassName("dt-paging-select-pages"), "onchange", function (e) {
        var selectedIndex = e.currentTarget.selectedIndex;
        var selectValue = e.currentTarget.options[selectedIndex].value;
        that.options.paging.pageSize = parseInt(selectValue);
        // 修改select自动跳到第一页
        that.goPage(1);
    });
    // 刷新按钮监听
    that.addEventListener(pagingContainer.getElementsByClassName("dt-paging-refresh"), "click", function (e) {
        // todo 刷新按钮
        console.log(111);
    });

    // ------- 分页栏监听 end -------

    // 表格容器click监听
    that.addEventListener(that.getContainerEle(), "click", function (e) {
        console.log("点击table");
    });
}

// 树默认展开或者关闭
DataTable.prototype.doDefaultOpenOrCloseTree = function () {
    var that = this;
    var treeOptions = that.options.treeOptions;
    if (!treeOptions) {
        return;
    }
    // 默认展开
    // 关闭处理
    if (!treeOptions.isExpand) {
        console.log(111);
        var icons = document.getElementsByClassName(that.tableVar.openRowClass);
        while (icons.length > 0) {
            that.triggerClick(icons[0]);
        }
    }
}

// 展开或者关闭行监听
DataTable.prototype.treeRowOpenOrClose = function (iconEle, isOpen) {
    var that = this;

    var displayStr = "";
    var iconStr = "";
    var rowClass = "";
    if (isOpen) {
        displayStr = "none";
        iconStr = "icon-plus-square-o";
        rowClass = that.tableVar.closeRowClass;
    } else {
        displayStr = "table-row";
        iconStr = "icon-minus-square-o";
        rowClass = that.tableVar.openRowClass;
    }

    var trEle = that.getTrEleByChildEle(iconEle);
    var treeLevel = parseInt(iconEle.parentNode.parentNode.dataset.treelevel);

    var childFlag = true;
    var nextEle = trEle.nextElementSibling;

    // 展开关闭图标替换
    var iconDivEle = nextEle.querySelector("." + that.tableVar.closeRowClass)
    if (iconDivEle) {
        iconDivEle.parentNode.innerHTML = '<i class="' + rowClass + ' iconfont ' + iconStr + '"></i>';
    }

    while (childFlag) {
        var nextEleLevel = parseInt(nextEle.querySelector(".dt-tree-row").dataset.treelevel);
        if (nextEleLevel > treeLevel) {
            nextEle.style.display = displayStr;
            nextEle = nextEle.nextElementSibling;
            if (nextEle == null) {
                childFlag = false;
            } else {
                // 展开关闭图标替换
                var iconDivEle = nextEle.querySelector("." + that.tableVar.closeRowClass)
                if (iconDivEle) {
                    iconDivEle.parentNode.innerHTML = '<i class="' + rowClass + ' iconfont ' + iconStr + '"></i>';
                }
            }
        } else {
            childFlag = false;
        }
    }

    var closeIconHtml = '<i class="' + rowClass + ' iconfont ' + iconStr + '"></i>';
    iconEle.parentNode.innerHTML = closeIconHtml;
}

// 树展开点击监听
DataTable.prototype.treeRowOpenEvent = function () {
    var that = this;
    that.addEventListener(document.getElementsByClassName(that.tableVar.openRowClass), "click", function (e) {
        that.treeRowOpenOrClose(e.currentTarget, true);
        that.treeRowCloseEvent();
        e.stopPropagation();
    });
}

// 树关闭点击监听
DataTable.prototype.treeRowCloseEvent = function () {
    var that = this;
    that.addEventListener(document.getElementsByClassName(that.tableVar.closeRowClass), "click", function (e) {
        that.treeRowOpenOrClose(e.currentTarget, false);
        that.treeRowOpenEvent();
        e.stopPropagation();
    });
}

// 表格数据加载后共通时间监听
DataTable.prototype.initGridEventAfterDataLoad = function () {
    var that = this;
    // 每行选中行checkbox监听
    that.addEventListener(document.getElementsByClassName(that.tableVar.selectRowCheckboxClass), "click", function (e) {
        var isChecked = e.currentTarget.checked;
        that.selectedRowsByChildNode(e.currentTarget, isChecked)
    });

    // 自定义icon点击监听
    // todo
    that.addEventListener(document.getElementsByClassName("dt-td-input-icon"), "click", function (e) {
        var tdEle = that.getTdEleByChildEle(e.currentTarget);
        var popupEle = tdEle.querySelector(".dt-td-popup");
        if (popupEle.style.display == "block") {
            popupEle.style.display = "none";
        } else {
            popupEle.style.display = "block";
        }
        e.stopPropagation();
    });

    // ----- 树处理 start -----
    // 树展开点击监听
    that.treeRowOpenEvent();
    // 树关闭监听
    that.treeRowCloseEvent();
    // 树展开点击监听
    that.doDefaultOpenOrCloseTree();
    // ----- 树处理 start -----
}

// 初始化表格属性
DataTable.prototype.reload = function (options) {
    var that = this;

    // 替换默认option参数
    if (typeof options === "object") {
        for (key in options) {
            if (options[key]) {
                that.options[key] = options[key];
            }
        }
    }

    that.init();
}
// 初始化表格属性
DataTable.prototype.init = function () {
    var that = this;

    // 设定表格容器div式样
    that.doContainerStyle();
    // table元素式样
    var tableTheadStyleHtml = that.doTableTheadStyle();
    var tableContentStyleHtml = that.doTableContentStyle();

    // ------ title 赋值 ------
    var titleHtml = that.initTitle();
    // ------ colgroup 列头赋值 ------
    var colgroupHtml = that.initColgroup();
    // ------ thead 列头赋值 ------
    var theadHtml = that.initThead();
    // ------ 分页 -----
    var pagingHtml = that.initPagingEle();
    // ------ 表格内容 -----
    var tbodyHtml = '<tbody></tbody>';
    // ------ 表格html ------
    var tableTitleHtml = titleHtml;
    var tableTheadHtml = colgroupHtml + theadHtml;
    var tableContentHtml = colgroupHtml + tbodyHtml;
    var tableTemplate = '<div class="dt-title-container"></i>#title#</div>' +
        '<div class="dt-thead-container" style="overflow-x: hidden;"><table class="dt-table" style="#theadStyle#">#thead#</table></div>' +
        '<div class="dt-tbody-container flex-1" style="overflow: auto;"><div style="height: 100%;">' +
        '<table class="dt-table dt-table-content " style="#contentStyle#" >#tableContent#</table>' +
        '</div></div>' +
        '<div class="dt-paging-container #pagingContainer#">#paging#</div>';
    var tableHtml = tableTemplate
        .replace("#title#", tableTitleHtml)
        .replace("#thead#", tableTheadHtml)
        .replace("#tableContent#", tableContentHtml)
        .replace("#theadStyle#", tableTheadStyleHtml)
        .replace("#contentStyle#", tableContentStyleHtml)
        .replace("#paging#", pagingHtml)
        .replace("#pagingContainer#", that.tableVar.pagingContainerClass);
    that.getContainerEle().innerHTML = tableHtml;

    // ------ tbody 表格行内容初始化&监听事件 ------
    that.initTbody();

};
