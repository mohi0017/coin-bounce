const Joi = require('joi');
const fs = require('fs'); 
const Blog = require("../models/blogs");
const Comment = require("../models/comments");
const BlogDTO = require("../dto/blog");
const BlogDetailsDTO = require("../dto/blog-details");

const {BACKEND_SERVER_PATH} = require("../config/index");
const mongodbIdPattern = /^[0-9a-fA-F]{24}$/;

const blogController = {
    async create(req,res,next){
        // 1. validate req body
        const createBlogSchema = Joi.object({
            title: Joi.string().required(),
            author: Joi.string().regex(mongodbIdPattern).required(),
            content: Joi.string().required(),
            // clinet side -> base64 encoded string -> decode -> store -> save photos path in db
            photo: Joi.string().required()
        });
        const {error} = createBlogSchema.validate(req.body);
        if (error)
        {
            return next(error);
        }
        const {title, author,content,photo}=req.body; 
        // 2. handle photostorage 
            //    read as buffer
        const buffer = Buffer.from(photo.replace(/^data:image\/(png|jpg|jpeg);base64,/,''),'base64');
            //    allot a random name
        const imagePath = `${Date.now()}-${author}.png`;
            //    save locally
        try{
            fs.writeFileSync(`storage/${imagePath}`,buffer);
        }
        catch(error)
        {
            return next(error);
        }
        // 3. add to db
        let newBlog ;
        try{
            newBlog = new Blog({
                title,
                author,
                content,
                PhotoPath: `${BACKEND_SERVER_PATH}/storage/${imagePath}`
            });
            await newBlog.save();
        }
        catch(error){
            return next(error);
        }
        // 4. return response
        const blogDto = new BlogDTO(newBlog);
        return res.status(201).json({blog:blogDto});
    },
    async getAll(req,res,next){
        try{
            const blogs = await Blog.find({});
            const blogsDto = [];
            for(let i=0; i < blogs.length; i++)
            {
                const dto = new BlogDTO(blogs[i]);
                blogsDto.push(dto);
            }
            return res.status(200).json({blogs:blogsDto});
        }
        catch(error){
            return next(error);
        }
    },
    async getById(req,res,next){
        // validate by id
        const getByIdSchema = Joi.object({
            id: Joi.string().regex(mongodbIdPattern).required()
        });
        const {error} = getByIdSchema.validate(req.params);
        if (error)
        {
            return next(error);
        }
        let blog;
        const {id} = req.params;
        try{
            blog = await Blog.findOne({_id:id}).populate('author');
        }
        catch(error){
            return next(error);
        }
        // response
        // 4. return response
        const blogDto = new BlogDetailsDTO(blog);
        return res.status(200).json({blog:blogDto});

    },
    async update(req,res,next){
        // 1. validate

        const updateBlogSchema = Joi.object({
            title: Joi.string().required(),
            content: Joi.string().required(),
            author: Joi.string().regex(mongodbIdPattern).required(),
            blogId: Joi.string().regex(mongodbIdPattern).required(),
            // clinet side -> base64 encoded string -> decode -> store -> save photos path in db
            photoPath: Joi.string()
        });

        const {error} = updateBlogSchema.validate(req.body);
        if (error)
        {
            return next(error);
        }
        const {title, content,author,blogId,photo}=req.body; 
        //  check if photo is going to be updated or not
        // if photo is updated then delete previous photo
        // and save photo again

        let blog;
        try{
            blog = await Blog.findOne({_id:blogId});
        }
        catch(error){
            return next(error);
        }

        if (photo)
        {
            let prevPhoto = blog.photoPath;
            prevPhoto = prevPhoto.split('/').at(-1);

            fs.unlinkSync(`storage/${prevPhoto}`);

            const buffer = Buffer.from(photo.replace(/^data:image\/(png|jpg|jpeg);base64,/,''),'base64');
            //    allot a random name
            const imagePath = `${Date.now()}-${author}.png`;
                //    save locally
            try{
                fs.writeFileSync(`storage/${imagePath}`,buffer);
            }
            catch(error)
            {
                return next(error);
            }
            await Blog.updateOne({_id:blogId},{title,author,content,photoPath:`${BACKEND_SERVER_PATH}/storage/${imagePath}`});

        }
        else{
            await Blog.updateOne({_id:blogId},{title,author,content});
        }
        return res.status(200).json({message:"Blog Updated Successfully!"});

    },
    async delete(req,res,next){
        // 1. validate
        // 2. delete blog
        // 3. delete comments

        const deleteBlogSchema = Joi.object({
            id: Joi.string().regex(mongodbIdPattern).required()
        });
        const {error} = deleteBlogSchema.validate(req.params);
        if(error){
            return next(error);
        }
        const {id}=req.params;

        try{

            await Blog.deleteOne({_id:id});
            await Comment.deleteMany({blog:id});

        }
        catch(error){
            return next(error);
        }
        return res.status(200).json({message:"Blog Deleted!"});
    }
};

module.exports=blogController;