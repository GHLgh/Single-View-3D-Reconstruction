Overview:

	This project aims to reconstruct 3D scene from one single 2D image with the constraints specified in Horry’s paper “Tour Into the Picture”. It provides an interactive user interface to define projection hints (rear wall and vanishing point) to improve the reconstruction.
	It also provides a series of MatLab code to process the image to extract front ground objects. It uses Intelligent Scissor for user to segment out the front ground objects. And it will repair the background image with inpainting code provided by Simone Parisotto (see Acknowledgement for detail). Usage: run “finalProjectImagePreProcessScript.m” under folder “./imageProcessing”.



Acknowledgement:

	For this project, I used external code posted on “MathWorks File Exchange” by Simone Parisotto on performing inpainting on masked background image. (https://www.mathworks.com/matlabcentral/fileexchange/55326-matlab-codes-for-the-image-inpainting-problem). For more detail on the license, please refer file “inpainting_mumford_shah.m” under folder “./imageProcessing/outsideCode”.

	For reconstructing 3D scene, I referred to CS445 lectures by professor Derek Hoiem. And I also researched on paper “Tour Into the Picture using Relative Depth Calculation” by Cao, et al (http://delivery.acm.org/10.1145/1050000/1044594/p38-cao.pdf?ip=130.126.255.205&id=1044594&acc=ACTIVE%20SERVICE&key=AAE16B9BF97F192F%2E4D4702B0C3E38B35%2E4D4702B0C3E38B35%2E4D4702B0C3E38B35&CFID=840578945&CFTOKEN=41438817&__acm__=1513285349_552e9d9f4ec0f54c24ff96be60b185af) and the original paper “Tour Into the Picture:Using a Spidery Mesh Interface to Make Animation from a Single Image” by Horry, et al (http://www.mizuno.org/gl/tip/pdf/Using_a_Spidery_Mesh_Interface_to_Make_Animation_from_a_Single_Image.pdf).

	For the interactive environment based on WebGL, I rewrote the code from my old projects in CS418, which can be found on GitHub (https://github.com/GHLgh/graphics) and referred to CS 418 lectures by professor Eric Shaffer.