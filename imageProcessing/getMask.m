function [mask, poly] = getMask(im, cost)
% [mask, poly] = getMask(im)
% Asks user to draw polygon around input image.  Provides binary mask of
% polygon and a chain of all interior boundary points.

disp('Draw polygon around source object in clockwise order, q to stop')
figure(1), hold off, imagesc(im), axis image;
sx = [];
sy = [];
while 1
    figure(1)
    [x, y, b] = ginput(1);
    if b=='q'
        break;
    end
    % find relation between previous end ptr
%     
%     
    sizeSx = size(sx);
    % need to have previous point
    disp(round(x));
    disp(round(y));
    if sizeSx(1) ~= 0
        [sx, sy] = cutFinding(cost, sy(end),sx(end), round(y),round(x), sx, sy);
    else
        sx(end+1) = round(x);
        sy(end+1) = round(y);
    end
    hold on, plot(sx, sy, '.-');
end

mask = poly2mask(sx, sy, size(im, 1), size(im, 2));
if nargout>1
    [poly.x, poly.y] = mask2chain(mask);
end
