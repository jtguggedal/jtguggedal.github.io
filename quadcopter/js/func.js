
// Check if two arrays are equal, with option to specify index interval to check
function arraysEqual(arr1, arr2, lower = 0, upper = 0) {
    if(arr1.length !== arr2.length)
        return false;

    var upperL = (upper == 0 ? arr1.length : upper);

    for(var i = upperL; i >= lower; i--) {
        if(arr1[i] !== arr2[i])
            return false;
    }
    return true;
}


// Function to return sum of array values
function sumArray(a) {
    function add(a, b) {
        return a + b;
    }
    return a.reduce(add, 0);
}
