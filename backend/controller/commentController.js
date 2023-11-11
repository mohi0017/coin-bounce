const Joi = require('joi');
const Comment = require("../models/comments");
const mongodbIdPattern = /^[0-9a-fA-F]{24}$/;
const CommentsDTO = require("../dto/comments");
const commentController = {
    async create(req,res,next){
        const createCommentSchema=Joi.object({
            content: Joi.string().required(),
            blog: Joi.string().regex(mongodbIdPattern).required(),
            author: Joi.string().regex(mongodbIdPattern).required()
        });

        const {error} = createCommentSchema.validate(req.body);
        if(error)
        {
            return next(error);
        }
        const {content,blog,author} = req.body;
        try{
            const newComment = new Comment({
                content,author,blog
            });
            await newComment.save();
        }
        catch(error)
        {
            return next(error);
        }
        return res.status(201).json({message:"Comment Created!"});

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
            const {id} = req.params;
            let comments;
            try{
                comments = await Comment.find({blog:id}).populate('author');
            }
            catch(error){
                return next(error);
            }
            // response
            let commentsdto = []
            for(let i=0;i<comments.length;i++)
            {
                const obj = new CommentsDTO(comments[i]);
                commentsdto.push(obj);
            }

            return res.status(200).json({data:commentsdto});
    }


};

module.exports = commentController;