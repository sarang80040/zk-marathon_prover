pragma circom 2.0.0;

include "circomlib/circuits/comparators.circom";

template Marathon() {
    signal input distance;
    signal output completed;

    component check = LessThan(32);

    check.in[0] <== distance;
    check.in[1] <== 42195;

    completed <== 1 - check.out;
    completed === 1;
}

component main = Marathon();