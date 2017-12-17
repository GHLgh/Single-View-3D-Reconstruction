function out = color2gray(im)
    % get the size of cropped source
    [imRow, imColumn, channel] = size(im);
    xind = 1:imColumn;
    yind = 1:imRow;
    
    gray = rgb2gray(im);
    imBackground = zeros([size(gray) 3]);
    for i = 1:3
        imBackground(:,:,i) = gray(:,:);
    end
    
    
    % get source region mask from the user
    maskSource = zeros([imRow imColumn]);
    maskSource(2:imRow-1, 2:imColumn-1) = ones([imRow-2 imColumn-2]);
    
    source = im;
    
    [buf, xRange] = size(xind);
    [buf, yRange] = size(yind);
    [imh, imw, nb] = size(source);
    imh = yRange;
    imw = xRange;
    im2var = zeros(imh, imw);
    im2var(1:imh*imw) = 1:imh*imw;
    A = sparse([], [], [],(imh*imw*4+1), imh*imw, (2*4*imh*imw));
    b = zeros([(4*imh*imw+1) nb]);
    
    
    % the range should be fine because we only mark the pixels in the mask
    % and the mask is smaller than the cropped source
    % the matrix entry for outside pixels are zeros
    e = 1;
    for y = 1:imh
        yBackground = yind(y);
        for x = 1:imw
            xBackground = xind(x);
            % in range
            if maskSource(yBackground, xBackground) == 1
                % check four direction
                for yShift = [-1 1]
                    A(e, im2var(y,x)) = 1;
                    % find source or background has larger difference in
                    % terms of gradient
                    sourceDiff = zeros([1 3]);
                    backgroundDiff = zeros([1 3]);
                    sourceDiff(1,:) = source(yBackground, xBackground,:) - source(yBackground+yShift, xBackground,:);
                    backgroundDiff(1,:) = imBackground(yBackground, xBackground,:) - imBackground(yBackground+yShift, xBackground,:);
                    
                    if sum(sourceDiff.^2) >= sum(backgroundDiff.^2) 
                        b(e,:) = sourceDiff(1,:);
                    else
                        b(e,:) = backgroundDiff(1,:);
                    end
                    
                    if maskSource(yBackground+yShift, xBackground) == 1
                        A(e, im2var(y+yShift, x)) = -1;
                    else
                        for channel = 1:3
                            b(e,channel) = b(e,channel) + imBackground(yBackground+yShift, xBackground,channel);
                        end
                    end
                    e = e+1;
                end
                
                for xShift = [-1 1]
                    A(e, im2var(y,x)) = 1;
                    
                    % find source or background has larger difference in
                    % terms of gradient
                    sourceDiff = zeros([1 3]);
                    backgroundDiff = zeros([1 3]);
                    sourceDiff(1,:) = source(yBackground, xBackground,:) - source(yBackground, xBackground+xShift,:);
                    backgroundDiff(1,:) = imBackground(yBackground, xBackground,:) - imBackground(yBackground, xBackground+xShift,:);
                    
                    if sum(sourceDiff.^2) >= sum(backgroundDiff.^2) 
                        b(e,:) = sourceDiff(1,:);
                    else
                        b(e,:) = backgroundDiff(1,:);
                    end
                    
                    if maskSource(yBackground, xBackground+xShift) == 1
                        A(e, im2var(y, x+xShift)) = -1;
                    else
                        for channel = 1:3
                            b(e,channel) = b(e,channel) + imBackground(yBackground, xBackground+xShift,channel);
                        end
                    end
                    e = e+1;
                end
            end
        end
    end
    for i = 1:3
        b(e,i) = imBackground(floor(imRow/2), floor(imColumn/2),i);
    end
    A(e,im2var(floor(imRow/2), floor(imColumn/2))) = 1;
    vRed = lscov(A,b(:,1));
    vGreen = lscov(A,b(:,2));
    vBlue = lscov(A,b(:,3));
    
    for y = 1:imh
        yBackground = yind(y);
        for x = 1:imw
            xBackground = xind(x);
            if maskSource(yBackground, xBackground) == 1
                imBackground(yBackground, xBackground,1) = vRed(im2var(y,x),1);
                imBackground(yBackground, xBackground,2) = vGreen(im2var(y,x),1);
                imBackground(yBackground, xBackground,3) = vBlue(im2var(y,x),1);
            end
        end
    end
    out = rgb2gray(imBackground);
end