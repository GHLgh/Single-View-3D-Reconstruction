%% use djikstra's algorithm from lecture

function [newSx, newSy] = cutFinding(cost, startX, startY, endX, endY, sx, sy)
newSx = sx;
newSy = sy;

sizePath = size(cost);

costToStart = ones(sizePath) .* (sizePath(1) * sizePath(2));
costToStart(endX, endY) = 0;

prevX = zeros(sizePath);
prevY = zeros(sizePath);

E = zeros(sizePath);

Acost = [];
Ax = [];
Ay = [];
Ax(end+1) = endX;
Ay(end+1) = endY;
Acost(end+1) = costToStart(endX, endY);

while 1
    sizeA = size(Acost);
    if sizeA(2) <= 0
        break;
    end
    
    % get smallest cost point in A
    [mVal, mIdx] = min(Acost);
    mXIdx = Ax(mIdx);
    mYIdx = Ay(mIdx);
    Acost(mIdx) = [];
    Ax(mIdx) = [];
    Ay(mIdx) = [];
    
    % add to E
    E(mXIdx, mYIdx) = 1;
    % update neighbour
    if mXIdx -1 > 0 && E(mXIdx-1, mYIdx) == 0
        tempCost = costToStart(mXIdx, mYIdx) + cost(mXIdx-1, mYIdx);
        % check if in A
        inA = 0;
        I = find(Ax == mXIdx -1);
        for i = I
            if Ay(i) == mYIdx
                inA = i;
                break;
            end
        end
        % just add it to A if not in
        if inA == 0 || tempCost < costToStart(mXIdx-1, mYIdx)
            costToStart(mXIdx-1, mYIdx) = tempCost;
            prevX(mXIdx-1, mYIdx) = mXIdx;
            prevY(mXIdx-1, mYIdx) = mYIdx;
            if inA == 0
                Acost(end+1) = tempCost;
                Ax(end+1) = mXIdx-1;
                Ay(end+1) = mYIdx;
            else
                Acost(inA) = tempCost;
            end
        end
    end
    
    if mXIdx +1 <= sizePath(1) && E(mXIdx+1, mYIdx) == 0
        tempCost = costToStart(mXIdx, mYIdx) + cost(mXIdx+1, mYIdx);
        % check if in A
        inA = 0;
        I = find(Ax == mXIdx +1);
        for i = I
            if Ay(i) == mYIdx
                inA = i;
                break;
            end
        end
        % just add it to A if not in
        if inA == 0 || tempCost < costToStart(mXIdx+1, mYIdx)
            costToStart(mXIdx+1, mYIdx) = tempCost;
            prevX(mXIdx+1, mYIdx) = mXIdx;
            prevY(mXIdx+1, mYIdx) = mYIdx;
            if inA == 0
                Acost(end+1) = tempCost;
                Ax(end+1) = mXIdx+1;
                Ay(end+1) = mYIdx;
            else
                Acost(inA) = tempCost;
            end
        end
    end
    
    if mYIdx -1 > 0 && E(mXIdx, mYIdx-1) == 0
        tempCost = costToStart(mXIdx, mYIdx) + cost(mXIdx, mYIdx-1);
        % check if in A
        inA = 0;
        I = find(Ax == mXIdx);
        for i = I
            if Ay(i) == mYIdx-1
                inA = i;
                break;
            end
        end
        % just add it to A if not in
        if inA == 0 || tempCost < costToStart(mXIdx, mYIdx-1)
            costToStart(mXIdx, mYIdx-1) = tempCost;
            prevX(mXIdx, mYIdx-1) = mXIdx;
            prevY(mXIdx, mYIdx-1) = mYIdx;
            if inA == 0
                Acost(end+1) = tempCost;
                Ax(end+1) = mXIdx;
                Ay(end+1) = mYIdx-1;
            else
                Acost(inA) = tempCost;
            end
        end
    end
    
    if mYIdx +1 <= sizePath(2) && E(mXIdx, mYIdx+1) == 0
        tempCost = costToStart(mXIdx, mYIdx) + cost(mXIdx, mYIdx+1);
        % check if in A
        inA = 0;
        I = find(Ax == mXIdx);
        for i = I
            if Ay(i) == mYIdx+1
                inA = i;
                break;
            end
        end
        % just add it to A if not in
        if inA == 0 || tempCost < costToStart(mXIdx, mYIdx+1)
            costToStart(mXIdx, mYIdx+1) = tempCost;
            prevX(mXIdx, mYIdx+1) = mXIdx;
            prevY(mXIdx, mYIdx+1) = mYIdx;
            if inA == 0
                Acost(end+1) = tempCost;
                Ax(end+1) = mXIdx;
                Ay(end+1) = mYIdx+1;
            else
                Acost(inA) = tempCost;
            end
        end
    end
    
end
disp('escaped')
disp(startX);
disp(startY);
disp(endX);
disp(endY);
% when it breaks, everything is done, find the path
currX = startX;
currY = startY;
while currX ~= endX || currY ~= endY
    disp('currX and Y');
    disp(currX);
    disp(currY);
    disp('targetX and Y');
    disp(endX);
    disp(endY);
    tempX = prevX(currX, currY);
    tempY = prevY(currX, currY);
    newSy(end+1) = tempX;
    newSx(end+1) = tempY;
    currX = tempX;
    currY = tempY;
end