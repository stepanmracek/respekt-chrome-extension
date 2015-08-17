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
            };
            x.onerror = function() {
                alert("Error");
                console.log(x);
            }
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

    getCurrentIssue = function() {
        issueDownloader.getContent($scope.currentIssueDate.year, $scope.currentIssueDate.week, function(data) {
            $scope.issue = data;
            $scope.$apply();
        });
    }

    getCurrentIssue();

    $scope.openUrl = function(url) {
        chrome.tabs.create({'url': "http://respekt.cz" + url});
    }

    $scope.prevIssue = function() {
        $scope.currentIssueDate.week -= 1;
        getCurrentIssue();
    }

});
