import os, sys
import json
import tensorflow as tf
import zerorpc

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

# change this as you see fit
labels_path = sys.argv[1]
graph_path = sys.argv[2]

# Loads label file, strips off carriage return
label_lines = [line.rstrip() for line in tf.gfile.GFile(labels_path)]

# Unpersists graph from file
with tf.gfile.FastGFile(graph_path, 'rb') as f:
    graph_def = tf.GraphDef()
    graph_def.ParseFromString(f.read())
    tf.import_graph_def(graph_def, name='')


session = tf.Session()
class label_image(object):
    def inference(self, path):
        image_path = path
        # Read in the image_data
        image_data = tf.gfile.FastGFile(image_path, 'rb').read()
        # Feed the image_data as input to the graph and get first prediction
        softmax_tensor = session.graph.get_tensor_by_name('final_result:0')

       	predictions = session.run(softmax_tensor, \
             {	'DecodeJpeg/contents:0': image_data})
    	# Sort to show labels of first prediction in order of confidence
        top_k = predictions[0].argsort()[-len(predictions[0]):][::-1]
        outputData = []
        for node_id in top_k:
            human_string = label_lines[node_id]
            score = predictions[0][node_id]
            text = '%s: %.2f' % (human_string, score)
            outputData.append(text)
        return json.dumps(outputData) 
    def inferenceForLine(self, path):
        image_path = path
        # Read in the image_data
        image_data = tf.gfile.FastGFile(image_path, 'rb').read()
        # Feed the image_data as input to the graph and get first prediction
        softmax_tensor = session.graph.get_tensor_by_name('final_result:0')

        predictions = session.run(softmax_tensor, \
             {	'DecodeJpeg/contents:0': image_data})

    	# Sort to show labels of first prediction in order of confidence
        top_k = predictions[0].argsort()[-len(predictions[0]):][::-1]
        outputData = []
        for node_id in top_k:
            human_string = label_lines[node_id]
            score = predictions[0][node_id]
            result = {
                "name": human_string,
                "score": "%.2f" % score
            }
            outputData.append(result) 
        return json.dumps(outputData)
#run Python Server
s = zerorpc.Server(label_image())
s.bind("tcp://0.0.0.0:5555")
s.run()
