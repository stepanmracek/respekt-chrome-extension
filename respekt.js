function getCurrentTabUrl(callback) {
    var queryInfo = {
        active: true,
        currentWindow: true
    };

    chrome.tabs.query(queryInfo, function(tabs) {
        var tab = tabs[0];
        var url = tab.url;
        console.assert(typeof url == 'string', 'tab.url should be a string');

        callback(url);
    });
}

var respektApp = angular.module('respekt', []);

respektApp.factory('issueDownloader', function() {
    var issueDownloader = {
        getContent: function(year, week, callback) {

            var resultData = {
                categories: [],
                items: {}
            };

            var url = 'http://www.respekt.cz/tydenik/' + year + '/' + week;
            var x = new XMLHttpRequest();
            x.open('GET', url);
            x.responseType = 'document';
            x.onload = function() {
                if (x.status == 200) {
                    var doc = x.responseXML;
                    var section = doc.getElementsByClassName('issuedetail-categorized-sectionname');
                    for (var i = 0; i < section.length; i++) {
                        var sectionElement = section[i];
                        var sectionName = sectionElement.firstChild.data;

                        var itemElement = sectionElement;
                        while (itemElement = itemElement.nextElementSibling) {
                            var itemTitle = itemElement.firstElementChild.firstChild.data;
                            var itemAuthor = itemElement.firstElementChild.nextElementSibling.firstChild.data;
                            var itemUrl = itemElement.getAttribute('href');
                            
                            if (!resultData.items[sectionName]) {
                                resultData.items[sectionName] = [];
                            }
                            resultData.items[sectionName].push({
                                title: itemTitle,
                                author: itemAuthor,
                                url: itemUrl
                            });
                        }

                        resultData.categories.push(sectionName);
                    }

                    callback(resultData);
                }
                else {
                    alert(x.status);
                    console.log(x);
                    callback(resultData);
                }
            };
            x.onerror = function() {
                alert("Error");
                console.log(x);
                callback(resultData);
            }
            x.send();
        },

        getItem: function(url, dataCallback) {
            url = "http://www.respekt.cz" + url;
            var x = new XMLHttpRequest();
            x.open('GET', url);
            x.responseType = 'document';
            x.onload = function() {
                if (x.status == 200) {
                    var doc = x.responseXML;
                    var postcontent = doc.getElementById('postcontent');

                    var paragraph = postcontent.firstElementChild;
                    console.log(url);
                    while (paragraph) {
                        console.log(paragraph.nodeName);
                        paragraph = paragraph.nextElementSibling;
                    }
                }
            };
            x.onerror = function() {

            };
            x.send();
        }

    };

    return issueDownloader;
});

respektApp.controller('issueCtrl', function($scope, issueDownloader) {

    $scope.currentIssueDate = {
        year: 2015,
        week: 34
    }

    var getCurrentIssue = function() {
        issueDownloader.getContent($scope.currentIssueDate.year, $scope.currentIssueDate.week, function(data) {
            $scope.issue = data;
            $scope.$apply();
        });
    }

    getCurrentIssue();

    $scope.openUrl = function(url) {
        chrome.tabs.create({'url': "http://www.respekt.cz" + url});
    }

    var getIssue = function(shift) {
        var newWeekNumber = $scope.currentIssueDate.week + shift;
        var newYear = $scope.currentIssueDate.year;
        if (newWeekNumber == 0) {
            newWeekNumber = 52;
            newYear = newYear - 1;
        }
        if (newWeekNumber == 53) {
            newWeekNumber = 1;
            newYear = newYear + 1;
        }

        $scope.currentIssueDate.week = newWeekNumber;
        $scope.currentIssueDate.year = newYear;
        getCurrentIssue();
    }

    $scope.prevIssue = function() {
        getIssue(-1);
    }

    $scope.nextIssue = function() {
        getIssue(1);
    }

    $scope.download = function() {
        $scope.issue.categories.forEach(function(category) {
            $scope.issue.items[category].forEach(function(item) {
                console.log(category + " - " + item.title);

                issueDownloader.getItem(item.url);
            });
        });
    }

});
