# Generated by Django 4.2.5 on 2024-01-09 23:17

import colorfield.fields
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('terminal', '0021_sshdata_hostname_sshdata_ip_sshdata_port_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='savedhost',
            name='color',
            field=colorfield.fields.ColorField(blank=True, default=None, help_text='Tab color', image_field=None, max_length=25, null=True, samples=[('#BA1C1C', 'Correl Red'), ('#2E9329', 'Forest Green'), ('#248BC2', 'Deep Blue'), ('#BD2DB6', 'Steel Pink'), ('#E0A61E', 'Harvest Gold')]),
        ),
        migrations.AlterField(
            model_name='sessionslist',
            name='color',
            field=colorfield.fields.ColorField(blank=True, default=None, help_text='Tab color', image_field=None, max_length=25, null=True, samples=[('#BA1C1C', 'Correl Red'), ('#2E9329', 'Forest Green'), ('#248BC2', 'Deep Blue'), ('#BD2DB6', 'Steel Pink'), ('#E0A61E', 'Harvest Gold')]),
        ),
    ]
