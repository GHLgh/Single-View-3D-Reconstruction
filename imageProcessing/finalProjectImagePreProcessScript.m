im_background = imresize(im2double(imread('../sources/buddhist_temple_at_varanasi.bmp')), 1, 'bilinear');
%im_object = imresize(im2double(imread('./sources/eye.jpg')), 0.25, 'bilinear');

% calculate naive cost
[Gmag,Gdir] = imgradient(rgb2gray(im_background), 'prewitt');
Gmag = (Gmag - min(min(Gmag))) ./ max(max(Gmag)) - min(min(Gmag));
Emag = edge(rgb2gray(im_background),'canny');
cost = (1-Gmag) .* 0.5 + (1-Emag) .* 0.5;

% get source region mask from the user
objmask = getMask(im_background, cost);
imwrite(objmask, '../outputs/mask.jpg');
imwrite(im_background, '../outputs/original.jpg');

mask = imresize(im2double(imread('../outputs/mask.jpg')), 1, 'bilinear');

%figure(3), hold off, imshow(objmask);


cd outsideCode
imagefilename = '../../outputs/original.jpg';
maskfilename  = '../../outputs/mask.jpg';

% PARAMETERS
maxiter       = 20; 
tol           = 1e-14;
param.lambda  = 10^9;   % weight on data fidelity (should usually be large).
param.alpha   = 1;  % regularisation parameters \alpha.
param.gamma   = 0.5;    % regularisation parameters \gamma.
param.epsilon = 0.05;    % accuracy of Ambrosio-Tortorelli approximation of the edge set.

inpainting_mumford_shah(imagefilename,maskfilename,maxiter,tol,param)

im_filled = imresize(im2double(imread('./output_mumford_shah.png')), 1, 'bilinear');


cd ..

imwrite(im_filled, '../outputs/filled.jpg');